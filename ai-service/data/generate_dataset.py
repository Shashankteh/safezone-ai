"""
SafeZone AI — Training Data Generator
Creates synthetic location risk dataset for model training.
In production, replace with real crime/incident data from:
- Police open data APIs
- Community incident reports
- OpenStreetMap data
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

def generate_training_data(n_samples=10000):
    """Generate synthetic training dataset for risk prediction."""
    
    np.random.seed(42)
    random.seed(42)
    
    data = []
    
    # Jaipur area coordinates (center: 26.9124, 75.7873)
    CENTER_LAT, CENTER_LNG = 26.9124, 75.7873
    
    # Define known high-risk zones (synthetic)
    high_risk_zones = [
        (26.9050, 75.7800),  # Zone A
        (26.9200, 75.7950),  # Zone B
        (26.8980, 75.7700),  # Zone C
    ]
    
    safe_zones = [
        (26.9124, 75.7873),  # City center
        (26.9300, 75.8100),  # Residential
        (26.8900, 75.8200),  # Campus area
    ]
    
    for i in range(n_samples):
        # Random coordinates in Jaipur area
        lat = CENTER_LAT + np.random.uniform(-0.1, 0.1)
        lng = CENTER_LNG + np.random.uniform(-0.1, 0.1)
        
        # Time features
        hour = random.randint(0, 23)
        day_of_week = random.randint(0, 6)  # 0=Monday
        month = random.randint(1, 12)
        is_weekend = 1 if day_of_week >= 5 else 0
        is_night = 1 if (hour >= 22 or hour <= 5) else 0
        is_late_evening = 1 if (hour >= 20 or hour <= 6) else 0
        
        # Distance from nearest high-risk zone
        dist_to_risk = min([
            np.sqrt((lat - z[0])**2 + (lng - z[1])**2)
            for z in high_risk_zones
        ]) * 111  # Convert to km approx
        
        # Distance from nearest safe zone
        dist_to_safe = min([
            np.sqrt((lat - z[0])**2 + (lng - z[1])**2)
            for z in safe_zones
        ]) * 111
        
        # Incident count in 500m radius (synthetic)
        base_incidents = max(0, int(np.random.poisson(2)))
        if dist_to_risk < 0.5:
            base_incidents += random.randint(3, 8)
        
        # Lighting score (0-1, lower = darker)
        if is_night:
            lighting = np.random.uniform(0.1, 0.5)
        else:
            lighting = np.random.uniform(0.6, 1.0)
        
        # Population density score (0-1)
        pop_density = np.random.uniform(0.3, 1.0)
        if is_night:
            pop_density *= 0.4
        
        # Police presence score (0-1)
        police_presence = np.random.uniform(0.2, 0.8)
        
        # User speed (0 = stationary, might be vulnerable)
        speed = np.random.exponential(2)  # m/s
        
        # Calculate risk score (0-1) based on features
        risk = 0.0
        
        # Night time adds risk
        risk += 0.25 * is_night
        risk += 0.10 * is_late_evening
        
        # Weekend night = higher risk
        risk += 0.10 * (is_weekend * is_night)
        
        # Proximity to known risk zones
        risk += 0.20 * max(0, (1 - dist_to_risk / 2.0))
        
        # Incident history
        risk += 0.15 * min(1.0, base_incidents / 10.0)
        
        # Poor lighting
        risk += 0.15 * (1 - lighting)
        
        # Low population (isolated)
        risk += 0.10 * (1 - pop_density)
        
        # Low police presence
        risk += 0.05 * (1 - police_presence)
        
        # Add noise
        risk += np.random.uniform(-0.05, 0.05)
        risk = max(0, min(1, risk))
        
        # Convert to label
        if risk < 0.35:
            label = 0  # Low risk
        elif risk < 0.65:
            label = 1  # Medium risk
        else:
            label = 2  # High risk
        
        data.append({
            'lat': lat,
            'lng': lng,
            'hour': hour,
            'day_of_week': day_of_week,
            'month': month,
            'is_weekend': is_weekend,
            'is_night': is_night,
            'is_late_evening': is_late_evening,
            'dist_to_risk_zone_km': round(dist_to_risk, 4),
            'dist_to_safe_zone_km': round(dist_to_safe, 4),
            'incident_count_500m': base_incidents,
            'lighting_score': round(lighting, 3),
            'population_density': round(pop_density, 3),
            'police_presence': round(police_presence, 3),
            'user_speed_ms': round(speed, 2),
            'risk_score': round(risk, 3),
            'risk_label': label  # 0=Low, 1=Medium, 2=High
        })
    
    df = pd.DataFrame(data)
    df.to_csv('data/training_data.csv', index=False)
    
    print(f"✅ Generated {n_samples} training samples")
    print(f"Label distribution:")
    print(df['risk_label'].value_counts().sort_index())
    print(f"\nFeature statistics:")
    print(df.describe())
    
    return df


if __name__ == '__main__':
    df = generate_training_data(10000)
    print("\n✅ Dataset saved to data/training_data.csv")
