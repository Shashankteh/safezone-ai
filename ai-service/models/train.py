"""
SafeZone AI — Risk Prediction Model Trainer
Trains a Random Forest classifier on location + time features.
Run: python models/train.py
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ─── Feature columns ─────────────────────────────────────────────────────────
FEATURE_COLS = [
    'hour',
    'day_of_week',
    'month',
    'is_weekend',
    'is_night',
    'is_late_evening',
    'dist_to_risk_zone_km',
    'dist_to_safe_zone_km',
    'incident_count_500m',
    'lighting_score',
    'population_density',
    'police_presence',
    'user_speed_ms',
]

TARGET_COL = 'risk_label'
LABELS = {0: 'Low', 1: 'Medium', 2: 'High'}
MODEL_PATH = 'models/risk_model.pkl'
SCALER_PATH = 'models/scaler.pkl'


def train_model():
    print("🤖 SafeZone AI — Risk Model Training")
    print("=" * 50)

    # ─── Load or generate data ────────────────────────────────────────────────
    data_path = 'data/training_data.csv'

    if not os.path.exists(data_path):
        print("📊 Generating training data...")
        from data.generate_dataset import generate_training_data
        df = generate_training_data(10000)
    else:
        print(f"📊 Loading data from {data_path}")
        df = pd.read_csv(data_path)

    print(f"✅ Loaded {len(df)} samples")
    print(f"Label distribution: {df[TARGET_COL].value_counts().to_dict()}")

    # ─── Prepare features ─────────────────────────────────────────────────────
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    # ─── Train/test split ─────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n📦 Train: {len(X_train)} | Test: {len(X_test)}")

    # ─── Build pipeline ───────────────────────────────────────────────────────
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])

    # ─── Train ────────────────────────────────────────────────────────────────
    print("\n🏋️  Training Random Forest (200 trees)...")
    pipeline.fit(X_train, y_train)

    # ─── Evaluate ─────────────────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n📊 Test Accuracy: {accuracy * 100:.2f}%")
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))

    # Cross validation
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
    print(f"📊 5-Fold CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

    # ─── Feature importance ───────────────────────────────────────────────────
    rf = pipeline.named_steps['classifier']
    importances = pd.DataFrame({
        'feature': FEATURE_COLS,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)

    print("\n🔍 Top Feature Importances:")
    for _, row in importances.head(7).iterrows():
        bar = '█' * int(row['importance'] * 50)
        print(f"  {row['feature']:<30} {bar} {row['importance']:.4f}")

    # ─── Save model ───────────────────────────────────────────────────────────
    os.makedirs('models', exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n✅ Model saved: {MODEL_PATH}")

    # Save metadata
    metadata = {
        'accuracy': float(accuracy),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'features': FEATURE_COLS,
        'labels': LABELS,
        'n_estimators': 200,
        'trained_on': len(df),
    }
    joblib.dump(metadata, 'models/metadata.pkl')
    print(f"✅ Metadata saved: models/metadata.pkl")

    return pipeline, accuracy


if __name__ == '__main__':
    model, acc = train_model()
    print(f"\n🎉 Training complete! Accuracy: {acc * 100:.2f}%")
    print("🚀 Run `python main.py` to start the API server")
