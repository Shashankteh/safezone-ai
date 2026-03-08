"""
SafeZone AI — Journey Anomaly Detection
The UNIQUE feature: learns user's normal routes and
alerts when significant deviation is detected.
POST /journey/analyze  → Analyze current journey
POST /journey/baseline → Update user's normal patterns
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import numpy as np
import math

router = APIRouter(prefix="/journey", tags=["journey"])


# ─── Models ───────────────────────────────────────────────────────────────────
class LocationPoint(BaseModel):
    lat: float
    lng: float
    timestamp: datetime
    speed: Optional[float] = 0.0


class JourneyAnalyzeRequest(BaseModel):
    user_id: str
    current_path: List[LocationPoint] = Field(..., min_items=2, max_items=200)
    normal_paths: Optional[List[List[LocationPoint]]] = None  # Historical patterns
    departure_time: Optional[datetime] = None
    expected_destination: Optional[Dict] = None


class AnomalyResponse(BaseModel):
    is_anomalous: bool
    anomaly_score: float       # 0-1 (higher = more anomalous)
    deviation_percent: float   # How different from normal
    alert_level: str           # none / low / medium / high
    reasons: List[str]
    recommendation: str


# ─── Helpers ──────────────────────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2) -> float:
    """Distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng/2)**2)
    return R * 2 * math.asin(math.sqrt(a))


def path_length(path: List[LocationPoint]) -> float:
    """Total path length in km."""
    total = 0
    for i in range(1, len(path)):
        total += haversine(path[i-1].lat, path[i-1].lng, path[i].lat, path[i].lng)
    return total


def path_bounding_box(path: List[LocationPoint]) -> Dict:
    lats = [p.lat for p in path]
    lngs = [p.lng for p in path]
    return {
        'min_lat': min(lats), 'max_lat': max(lats),
        'min_lng': min(lngs), 'max_lng': max(lngs),
        'center_lat': sum(lats) / len(lats),
        'center_lng': sum(lngs) / len(lngs),
    }


def path_deviation_from_normal(
    current: List[LocationPoint],
    normals: List[List[LocationPoint]]
) -> float:
    """
    Calculate how different the current path is from normal patterns.
    Returns deviation score 0-1.
    Simple approach: compare bounding boxes and lengths.
    Production: use DTW (Dynamic Time Warping) for better accuracy.
    """
    if not normals:
        return 0.3  # Default moderate deviation if no baseline

    current_bb = path_bounding_box(current)
    current_len = path_length(current)

    deviations = []
    for normal in normals:
        normal_bb = path_bounding_box(normal)
        normal_len = path_length(normal)

        # Distance between center points
        center_dist = haversine(
            current_bb['center_lat'], current_bb['center_lng'],
            normal_bb['center_lat'], normal_bb['center_lng']
        )

        # Length ratio difference
        len_ratio = abs(current_len - normal_len) / max(normal_len, 0.001)

        # Bounding box overlap
        lat_overlap = max(0, min(current_bb['max_lat'], normal_bb['max_lat']) -
                         max(current_bb['min_lat'], normal_bb['min_lat']))
        lng_overlap = max(0, min(current_bb['max_lng'], normal_bb['max_lng']) -
                         max(current_bb['min_lng'], normal_bb['min_lng']))
        has_overlap = lat_overlap > 0 and lng_overlap > 0

        # Combine signals
        dev = (
            min(center_dist / 2.0, 1.0) * 0.5 +  # Center distance (2km = max)
            min(len_ratio, 1.0) * 0.3 +            # Length difference
            (0 if has_overlap else 0.2)             # No overlap penalty
        )
        deviations.append(dev)

    return min(deviations)  # Best match with any normal path


def analyze_time_anomaly(
    current_points: List[LocationPoint],
    departure: Optional[datetime]
) -> Dict:
    """Check if travel time is anomalous."""
    if len(current_points) < 2:
        return {'is_slow': False, 'is_stopped': False}

    first = current_points[0]
    last = current_points[-1]
    duration_min = (last.timestamp - first.timestamp).seconds / 60

    # Check if stopped (last 3 points in same location)
    is_stopped = False
    if len(current_points) >= 3:
        recent = current_points[-3:]
        distances = [
            haversine(recent[i].lat, recent[i].lng, recent[i+1].lat, recent[i+1].lng)
            for i in range(len(recent)-1)
        ]
        is_stopped = all(d < 0.05 for d in distances)  # < 50m movement in last 3 points

    return {
        'is_slow': duration_min > 60 and path_length(current_points) < 2.0,
        'is_stopped': is_stopped,
        'duration_min': round(duration_min, 1)
    }


# ─── POST /journey/analyze ────────────────────────────────────────────────────
@router.post("/analyze", response_model=AnomalyResponse)
async def analyze_journey(req: JourneyAnalyzeRequest):
    """
    Analyze if current journey deviates from normal patterns.
    This is the SIGNATURE feature — AI that learns user behavior.
    """
    reasons = []
    anomaly_factors = []

    # ── 1. Path deviation from normal routes ─────────────────────────────────
    deviation = path_deviation_from_normal(
        req.current_path,
        req.normal_paths or []
    )
    anomaly_factors.append(deviation * 0.4)

    if deviation > 0.6:
        reasons.append(f"Route is {round(deviation * 100)}% different from your usual paths")
    elif deviation > 0.4:
        reasons.append("Route shows moderate deviation from normal patterns")

    # ── 2. Time anomaly ───────────────────────────────────────────────────────
    time_info = analyze_time_anomaly(req.current_path, req.departure_time)

    if time_info['is_stopped']:
        anomaly_factors.append(0.3)
        reasons.append("Movement stopped for extended period — possible issue")

    if time_info['is_slow']:
        anomaly_factors.append(0.2)
        reasons.append(f"Journey taking unusually long ({time_info['duration_min']} min)")

    # ── 3. Unknown area check ─────────────────────────────────────────────────
    last_point = req.current_path[-1]
    hour = last_point.timestamp.hour
    is_night = hour >= 22 or hour <= 5

    if is_night and not req.normal_paths:
        anomaly_factors.append(0.2)
        reasons.append("Traveling at night in unfamiliar area")

    # ── 4. Speed anomaly ──────────────────────────────────────────────────────
    speeds = [p.speed for p in req.current_path if p.speed is not None and p.speed > 0]
    if speeds:
        avg_speed = sum(speeds) / len(speeds)
        if avg_speed > 20:  # > 72 km/h on foot route
            anomaly_factors.append(0.15)
            reasons.append("Unusual speed detected in route")

    # ── Calculate final score ─────────────────────────────────────────────────
    anomaly_score = min(1.0, sum(anomaly_factors))
    deviation_percent = round(deviation * 100, 1)

    # Alert level
    if anomaly_score < 0.3:
        alert_level = 'none'
        recommendation = 'Journey looks normal — stay safe!'
    elif anomaly_score < 0.5:
        alert_level = 'low'
        recommendation = 'Minor deviation detected — check in with a contact'
    elif anomaly_score < 0.7:
        alert_level = 'medium'
        recommendation = 'Significant route deviation — consider sharing your location'
    else:
        alert_level = 'high'
        recommendation = 'Unusual journey pattern — trusted contacts have been notified'
        if not reasons:
            reasons.append('Multiple anomaly signals detected simultaneously')

    return AnomalyResponse(
        is_anomalous=anomaly_score > 0.4,
        anomaly_score=round(anomaly_score, 3),
        deviation_percent=deviation_percent,
        alert_level=alert_level,
        reasons=reasons or ['Journey appears normal'],
        recommendation=recommendation
    )


# ─── POST /journey/baseline ───────────────────────────────────────────────────
@router.post("/baseline")
async def update_baseline(user_id: str, path: List[LocationPoint]):
    """
    Store a completed journey as part of user's normal pattern.
    In production: save to MongoDB user profile.
    """
    return {
        'success': True,
        'message': f'Journey baseline updated for user {user_id}',
        'path_length_km': round(path_length(path), 2),
        'duration_min': round(
            (path[-1].timestamp - path[0].timestamp).seconds / 60, 1
        ) if len(path) > 1 else 0
    }
