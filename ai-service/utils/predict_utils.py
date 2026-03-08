"""
SafeZone AI — Prediction Utilities
Feature engineering + model inference helpers
"""

import math
import numpy as np
from datetime import datetime
from typing import Tuple, List, Dict, Optional

# ─── Known risk/safe zones (Jaipur — replace with real data) ─────────────────
HIGH_RISK_ZONES = [
    (26.9050, 75.7800),
    (26.9200, 75.7950),
    (26.8980, 75.7700),
]

SAFE_ZONES = [
    (26.9124, 75.7873),
    (26.9300, 75.8100),
    (26.8900, 75.8200),
]


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in km."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def get_nearest_zone_distance(lat: float, lng: float, zones: list) -> float:
    """Get distance to nearest zone in km."""
    return min(haversine_distance(lat, lng, z[0], z[1]) for z in zones)


def build_features(
    lat: float,
    lng: float,
    timestamp: Optional[datetime] = None,
    incident_count: int = 0,
    lighting_score: float = 0.7,
    population_density: float = 0.6,
    police_presence: float = 0.5,
    user_speed: float = 1.0,
) -> List[float]:
    """
    Build feature vector for risk prediction.
    Order must match FEATURE_COLS in train.py
    """
    if timestamp is None:
        timestamp = datetime.utcnow()

    hour = timestamp.hour
    day_of_week = timestamp.weekday()  # 0=Monday
    month = timestamp.month
    is_weekend = 1 if day_of_week >= 5 else 0
    is_night = 1 if (hour >= 22 or hour <= 5) else 0
    is_late_evening = 1 if (hour >= 20 or hour <= 6) else 0

    dist_to_risk = get_nearest_zone_distance(lat, lng, HIGH_RISK_ZONES)
    dist_to_safe = get_nearest_zone_distance(lat, lng, SAFE_ZONES)

    # Auto-estimate lighting based on time if not provided
    if lighting_score == 0.7:  # Default value = not provided
        if is_night:
            lighting_score = 0.2
        elif is_late_evening:
            lighting_score = 0.5
        else:
            lighting_score = 0.85

    # Auto-estimate population based on time
    if population_density == 0.6:
        if is_night:
            population_density = 0.2
        elif is_late_evening:
            population_density = 0.4
        else:
            population_density = 0.7

    return [
        hour,
        day_of_week,
        month,
        is_weekend,
        is_night,
        is_late_evening,
        round(dist_to_risk, 4),
        round(dist_to_safe, 4),
        incident_count,
        lighting_score,
        population_density,
        police_presence,
        user_speed,
    ]


def get_risk_label(label_int: int) -> str:
    return {0: 'Low', 1: 'Medium', 2: 'High'}.get(label_int, 'Unknown')


def get_risk_color(label: str) -> str:
    return {'Low': '#00ff88', 'Medium': '#ffaa00', 'High': '#ff3366'}.get(label, '#ffffff')


def get_risk_advice(label: str, hour: int) -> List[str]:
    """Generate contextual safety advice based on risk level."""
    base_advice = {
        'Low': [
            'Area appears safe — stay aware of surroundings',
            'Share your location with a trusted contact',
        ],
        'Medium': [
            'Stay in well-lit, populated areas',
            'Keep your phone charged and accessible',
            'Inform someone of your route',
            'Trust your instincts — leave if uncomfortable',
        ],
        'High': [
            '🚨 High risk area detected — avoid if possible',
            'Contact a trusted person immediately',
            'Move to a populated, well-lit location',
            'Keep emergency contacts ready to call',
            'Consider using the Fake Call feature',
        ],
    }

    advice = base_advice.get(label, [])

    # Time-specific advice
    if 22 <= hour or hour <= 5:
        advice.append('Late night — consider alternative transportation')
    if 6 <= hour <= 9 or 17 <= hour <= 20:
        advice.append('Peak hours — stay alert in crowded areas')

    return advice


def generate_safe_alternatives(lat: float, lng: float, count: int = 3) -> List[Dict]:
    """
    Generate nearby safer location suggestions.
    In production: use real safe places from Google Places API.
    """
    alternatives = []
    offsets = [
        (0.002, 0.003, 'Nearby Police Station'),
        (-0.003, 0.001, 'Public Area'),
        (0.001, -0.004, 'Commercial Zone'),
    ]

    for dlat, dlng, name in offsets[:count]:
        alternatives.append({
            'lat': round(lat + dlat, 6),
            'lng': round(lng + dlng, 6),
            'name': name,
            'type': 'safe_point'
        })

    return alternatives
