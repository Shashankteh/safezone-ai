"""
SafeZone AI — Heatmap Routes
GET /heatmap/incidents  → Incident heatmap data
GET /heatmap/safety     → Safety score grid
GET /heatmap/live       → Live risk heatmap using ML
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import numpy as np
import random

router = APIRouter(prefix="/heatmap", tags=["heatmap"])


# ─── Synthetic incident data generator ───────────────────────────────────────
def generate_incident_heatmap(center_lat: float, center_lng: float, radius_km: float = 5.0):
    """
    Generate synthetic incident heatmap.
    In production: query MongoDB incidents collection directly.
    """
    random.seed(42)
    np.random.seed(42)

    incidents = []
    n_incidents = 150

    # Create clusters of incidents
    cluster_centers = [
        (center_lat + 0.02, center_lng - 0.01, 0.8),   # High density
        (center_lat - 0.01, center_lng + 0.03, 0.6),   # Medium
        (center_lat + 0.04, center_lng + 0.02, 0.4),   # Low
        (center_lat - 0.03, center_lng - 0.02, 0.9),   # Very high
    ]

    for cc in cluster_centers:
        n = int(n_incidents * cc[2] / sum(c[2] for c in cluster_centers))
        for _ in range(n):
            lat = cc[0] + np.random.normal(0, 0.005)
            lng = cc[1] + np.random.normal(0, 0.005)
            incidents.append({
                'lat': round(lat, 6),
                'lng': round(lng, 6),
                'weight': round(random.uniform(0.3, 1.0), 2),
                'type': random.choice(['theft', 'harassment', 'suspicious', 'assault']),
                'severity': random.randint(1, 3),
            })

    return incidents


# ─── GET /heatmap/incidents ───────────────────────────────────────────────────
@router.get("/incidents")
async def get_incident_heatmap(
    center_lat: float = Query(..., description="Center latitude"),
    center_lng: float = Query(..., description="Center longitude"),
    radius_km: float = Query(5.0, ge=0.5, le=50),
    hours_back: int = Query(168, ge=1, le=720),  # Default: last 7 days
):
    """
    Get incident heatmap data for map visualization.
    Returns weighted points for Mapbox heatmap layer.
    """
    incidents = generate_incident_heatmap(center_lat, center_lng, radius_km)

    return {
        'success': True,
        'incidents': incidents,
        'count': len(incidents),
        'center': {'lat': center_lat, 'lng': center_lng},
        'radius_km': radius_km,
        'period_hours': hours_back,
        'timestamp': datetime.utcnow().isoformat()
    }


# ─── GET /heatmap/safety ──────────────────────────────────────────────────────
@router.get("/safety")
async def get_safety_scores(
    center_lat: float = Query(...),
    center_lng: float = Query(...),
    radius_km: float = Query(2.0, ge=0.5, le=20),
):
    """
    Get community safety scores for an area.
    Scores are 0-100 (100 = safest).
    """
    # Generate grid of safety scores
    random.seed(int(center_lat * 100 + center_lng * 100))  # Deterministic per location
    scores = []

    step = 0.003  # ~300m grid
    for dlat in np.arange(-0.03, 0.03, step):
        for dlng in np.arange(-0.03, 0.03, step):
            lat = center_lat + dlat
            lng = center_lng + dlng

            # Base score with spatial smoothing
            base = 70 + random.gauss(0, 15)
            base = max(10, min(100, base))

            scores.append({
                'lat': round(lat, 5),
                'lng': round(lng, 5),
                'score': round(base, 1),
                'grade': 'A' if base >= 80 else 'B' if base >= 60 else 'C' if base >= 40 else 'D'
            })

    return {
        'success': True,
        'scores': scores,
        'count': len(scores),
        'average_score': round(sum(s['score'] for s in scores) / len(scores), 1)
    }


# ─── GET /heatmap/live ────────────────────────────────────────────────────────
@router.get("/live")
async def get_live_risk_heatmap(
    center_lat: float = Query(...),
    center_lng: float = Query(...),
):
    """
    Real-time risk heatmap using ML predictions.
    Combines incident history + time-aware ML model.
    """
    try:
        import joblib
        import os
        from utils.predict_utils import build_features

        model = None
        if os.path.exists('models/risk_model.pkl'):
            model = joblib.load('models/risk_model.pkl')

        now = datetime.utcnow()
        grid_points = []
        step = 0.004

        for dlat in np.arange(-0.02, 0.02, step):
            for dlng in np.arange(-0.02, 0.02, step):
                lat = center_lat + dlat
                lng = center_lng + dlng

                if model:
                    features = build_features(lat=lat, lng=lng, timestamp=now)
                    features_array = np.array(features).reshape(1, -1)
                    probs = model.predict_proba(features_array)[0]
                    risk = float(probs[0] * 0.1 + probs[1] * 0.5 + probs[2] * 0.9)
                else:
                    # Fallback: simple time-based estimate
                    hour = now.hour
                    risk = 0.7 if (hour >= 22 or hour <= 5) else 0.3

                grid_points.append({
                    'lat': round(lat, 5),
                    'lng': round(lng, 5),
                    'risk': round(risk, 3)
                })

        return {
            'success': True,
            'grid': grid_points,
            'timestamp': now.isoformat(),
            'model_used': model is not None
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}
