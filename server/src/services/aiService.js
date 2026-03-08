/**
 * SafeZone AI — AI Service Client
 * Node.js → Python FastAPI microservice bridge
 */

const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Get risk prediction for a location
 * @param {number} lat
 * @param {number} lng
 * @param {object} opts - optional: incident_count, lighting_score, etc.
 */
const getRiskPrediction = async (lat, lng, opts = {}) => {
  try {
    const res = await aiClient.post('/predict', { lat, lng, ...opts });
    return res.data;
  } catch (err) {
    console.error('AI service error (predict):', err.message);
    // Graceful fallback — don't crash the main app
    return {
      risk_score: 0.3,
      risk_label: 'Low',
      risk_color: '#00ff88',
      confidence: 0,
      advice: ['AI service unavailable — stay aware of surroundings'],
      safe_alternatives: [],
    };
  }
};

/**
 * Get incident heatmap data
 */
const getHeatmap = async (centerLat, centerLng, radiusKm = 5) => {
  try {
    const res = await aiClient.get('/heatmap/incidents', {
      params: { center_lat: centerLat, center_lng: centerLng, radius_km: radiusKm }
    });
    return res.data;
  } catch (err) {
    console.error('AI service error (heatmap):', err.message);
    return { success: false, incidents: [] };
  }
};

/**
 * Get live risk grid for map heatmap
 */
const getLiveRiskGrid = async (centerLat, centerLng) => {
  try {
    const res = await aiClient.get('/heatmap/live', {
      params: { center_lat: centerLat, center_lng: centerLng }
    });
    return res.data;
  } catch (err) {
    console.error('AI service error (live grid):', err.message);
    return { success: false, grid: [] };
  }
};

/**
 * Analyze journey for anomalies
 */
const analyzeJourney = async (userId, currentPath, normalPaths = []) => {
  try {
    const res = await aiClient.post('/journey/analyze', {
      user_id: userId,
      current_path: currentPath,
      normal_paths: normalPaths,
    });
    return res.data;
  } catch (err) {
    console.error('AI service error (journey):', err.message);
    return {
      is_anomalous: false,
      anomaly_score: 0,
      alert_level: 'none',
      recommendation: 'Journey analysis unavailable'
    };
  }
};

/**
 * Check if AI service is healthy
 */
const checkHealth = async () => {
  try {
    const res = await aiClient.get('/health');
    return res.data;
  } catch {
    return { status: 'unreachable', model_ready: false };
  }
};

module.exports = { getRiskPrediction, getHeatmap, getLiveRiskGrid, analyzeJourney, checkHealth };
