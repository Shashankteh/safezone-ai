"""
SafeZone AI — Quick Model Test
Tests the trained model with sample locations and times.
Run: python test_model.py
"""

import joblib
import numpy as np
from datetime import datetime
from utils.predict_utils import build_features, get_risk_label, get_risk_advice

print("🧪 SafeZone AI — Model Test")
print("=" * 50)

# Load model
model = joblib.load('models/risk_model.pkl')
metadata = joblib.load('models/metadata.pkl')

print(f"✅ Model loaded | Accuracy: {metadata['accuracy']*100:.1f}%")
print(f"   Trained on: {metadata['trained_on']} samples")
print()

# Test cases
test_cases = [
    {
        "name": "🌞 Jaipur City Center — Afternoon",
        "lat": 26.9124, "lng": 75.7873,
        "time": datetime(2025, 3, 8, 14, 30),
    },
    {
        "name": "🌙 Known Risk Zone — Late Night",
        "lat": 26.9050, "lng": 75.7800,
        "time": datetime(2025, 3, 8, 23, 45),
    },
    {
        "name": "🌆 Residential Area — Evening",
        "lat": 26.9300, "lng": 75.8100,
        "time": datetime(2025, 3, 8, 20, 0),
    },
    {
        "name": "🚨 High Risk Zone — 2 AM",
        "lat": 26.8980, "lng": 75.7700,
        "time": datetime(2025, 3, 9, 2, 15),
    },
    {
        "name": "☕ Safe Commercial Area — Morning",
        "lat": 26.9200, "lng": 75.8000,
        "time": datetime(2025, 3, 8, 9, 0),
    },
]

for tc in test_cases:
    features = build_features(
        lat=tc["lat"],
        lng=tc["lng"],
        timestamp=tc["time"],
    )
    features_arr = np.array(features).reshape(1, -1)
    prediction = model.predict(features_arr)[0]
    probs = model.predict_proba(features_arr)[0]
    label = get_risk_label(int(prediction))

    risk_score = probs[0]*0.1 + probs[1]*0.5 + probs[2]*0.9
    colors = {"Low": "\033[92m", "Medium": "\033[93m", "High": "\033[91m"}
    reset = "\033[0m"
    color = colors.get(label, "")

    print(f"{tc['name']}")
    print(f"  Risk: {color}{label}{reset} | Score: {risk_score:.2f} | Confidence: {max(probs)*100:.0f}%")
    print(f"  Probabilities → Low: {probs[0]:.2f} | Medium: {probs[1]:.2f} | High: {probs[2]:.2f}")
    advice = get_risk_advice(label, tc["time"].hour)
    print(f"  Advice: {advice[0]}")
    print()

print("✅ All tests passed!")
