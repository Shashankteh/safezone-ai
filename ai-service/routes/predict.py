"""
SafeZone AI — Risk Prediction Routes
POST /predict  → Single location risk score
POST /predict/batch → Multiple locations
GET  /predict/area  → Risk grid for map heatmap
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import numpy as np
import joblib
import os

from utils.predict_utils import (
    build_features,
    get_risk_label,
    get_risk_color,
    get_risk_advice,
    generate_safe_alternatives,
)

router = APIRouter(prefix="/predict", tags=["prediction"])

# ─── Model loader (lazy, singleton) ──────────────────────────────────────────
_model = None
_metadata = None

def get_model():
    global _model, _metadata
    if _model is None:
        model_path = 'models/risk_model.pkl'
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=503,
                detail="Model not trained yet. Run: python models/train.py"
            )
        _model = joblib.load(model_path)

        meta_path = 'models/metadata.pkl'
        if os.path.exists(meta_path):
            _metadata = joblib.load(meta_path)

    return _model


# ─── Request / Response Models ────────────────────────────────────────────────
class PredictRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    timestamp: Optional[datetime] = None
    incident_count: Optional[int] = Field(0, ge=0, le=100)
    lighting_score: Optional[float] = Field(0.7, ge=0.0, le=1.0)
    population_density: Optional[float] = Field(0.6, ge=0.0, le=1.0)
    police_presence: Optional[float] = Field(0.5, ge=0.0, le=1.0)
    user_speed: Optional[float] = Field(1.0, ge=0.0, le=50.0)

    class Config:
        json_schema_extra = {
            "example": {
                "lat": 26.9124,
                "lng": 75.7873,
                "timestamp": "2025-03-08T22:30:00"
            }
        }


class BatchPredictRequest(BaseModel):
    locations: List[PredictRequest] = Field(..., max_items=50)


class RiskResponse(BaseModel):
    risk_score: float
    risk_label: str
    risk_color: str
    confidence: float
    probabilities: dict
    advice: List[str]
    safe_alternatives: List[dict]
    timestamp: str
    coordinates: dict


# ─── POST /predict ────────────────────────────────────────────────────────────
@router.post("/", response_model=RiskResponse)
async def predict_risk(req: PredictRequest):
    """
    Predict risk level for a single location.
    Returns risk score, label, advice, and safe alternatives.
    """
    model = get_model()

    ts = req.timestamp or datetime.utcnow()

    # Build feature vector
    features = build_features(
        lat=req.lat,
        lng=req.lng,
        timestamp=ts,
        incident_count=req.incident_count or 0,
        lighting_score=req.lighting_score or 0.7,
        population_density=req.population_density or 0.6,
        police_presence=req.police_presence or 0.5,
        user_speed=req.user_speed or 1.0,
    )

    features_array = np.array(features).reshape(1, -1)

    # Predict
    prediction = model.predict(features_array)[0]
    probabilities = model.predict_proba(features_array)[0]

    label = get_risk_label(int(prediction))
    confidence = float(max(probabilities))
    risk_score = float(
        probabilities[0] * 0.1 +   # Low → low score
        probabilities[1] * 0.5 +   # Medium → mid score
        probabilities[2] * 0.9     # High → high score
    )

    return RiskResponse(
        risk_score=round(risk_score, 3),
        risk_label=label,
        risk_color=get_risk_color(label),
        confidence=round(confidence, 3),
        probabilities={
            'Low': round(float(probabilities[0]), 3),
            'Medium': round(float(probabilities[1]), 3),
            'High': round(float(probabilities[2]), 3),
        },
        advice=get_risk_advice(label, ts.hour),
        safe_alternatives=generate_safe_alternatives(req.lat, req.lng),
        timestamp=ts.isoformat(),
        coordinates={'lat': req.lat, 'lng': req.lng}
    )


# ─── POST /predict/batch ──────────────────────────────────────────────────────
@router.post("/batch")
async def predict_batch(req: BatchPredictRequest):
    """Predict risk for multiple locations at once (max 50)."""
    model = get_model()
    results = []

    for loc in req.locations:
        ts = loc.timestamp or datetime.utcnow()
        features = build_features(
            lat=loc.lat, lng=loc.lng, timestamp=ts,
            incident_count=loc.incident_count or 0,
        )
        features_array = np.array(features).reshape(1, -1)
        prediction = model.predict(features_array)[0]
        probabilities = model.predict_proba(features_array)[0]
        label = get_risk_label(int(prediction))

        results.append({
            'lat': loc.lat,
            'lng': loc.lng,
            'risk_label': label,
            'risk_score': round(float(
                probabilities[0] * 0.1 +
                probabilities[1] * 0.5 +
                probabilities[2] * 0.9
            ), 3),
            'risk_color': get_risk_color(label),
        })

    return {'success': True, 'results': results, 'count': len(results)}


# ─── GET /predict/area ────────────────────────────────────────────────────────
@router.get("/area")
async def predict_area(
    center_lat: float,
    center_lng: float,
    radius_km: float = 2.0,
    grid_size: int = 10
):
    """
    Generate risk grid for a geographic area.
    Used for map heatmap rendering.
    Max grid_size = 20 (400 points max)
    """
    if grid_size > 20:
        grid_size = 20

    model = get_model()
    now = datetime.utcnow()
    results = []

    step = (radius_km / 111) / grid_size  # Convert km to degrees approx

    for i in range(grid_size):
        for j in range(grid_size):
            lat = center_lat - (radius_km / 111) + (i * step * 2)
            lng = center_lng - (radius_km / 111) + (j * step * 2)

            features = build_features(lat=lat, lng=lng, timestamp=now)
            features_array = np.array(features).reshape(1, -1)
            probabilities = model.predict_proba(features_array)[0]

            risk_score = float(
                probabilities[0] * 0.1 +
                probabilities[1] * 0.5 +
                probabilities[2] * 0.9
            )

            results.append({
                'lat': round(lat, 5),
                'lng': round(lng, 5),
                'risk_score': round(risk_score, 3),
            })

    return {
        'success': True,
        'grid': results,
        'count': len(results),
        'center': {'lat': center_lat, 'lng': center_lng},
        'radius_km': radius_km,
        'timestamp': now.isoformat()
    }


# ─── GET /predict/model-info ──────────────────────────────────────────────────
@router.get("/model-info")
async def model_info():
    """Return model metadata and performance stats."""
    try:
        get_model()
        return {
            'success': True,
            'model': 'RandomForestClassifier',
            'metadata': _metadata or {},
            'status': 'loaded'
        }
    except HTTPException:
        return {'success': False, 'status': 'not_trained'}
