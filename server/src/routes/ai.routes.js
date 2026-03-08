const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getRiskPrediction, getHeatmap, getLiveRiskGrid, analyzeJourney, checkHealth } = require('../services/aiService');

// All AI routes require auth
router.use(protect);

// POST /api/ai/risk — predict risk for current location
router.post('/risk', async (req, res) => {
  try {
    const { lat, lng, incident_count, lighting_score } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const prediction = await getRiskPrediction(lat, lng, { incident_count, lighting_score });

    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai/heatmap — incident heatmap for map
router.get('/heatmap', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const data = await getHeatmap(parseFloat(lat), parseFloat(lng), parseFloat(radius) || 5);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai/heatmap/live — real-time risk grid
router.get('/heatmap/live', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const data = await getLiveRiskGrid(parseFloat(lat), parseFloat(lng));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/journey — analyze journey anomaly
router.post('/journey', async (req, res) => {
  try {
    const { current_path, normal_paths } = req.body;
    if (!current_path?.length) {
      return res.status(400).json({ success: false, message: 'current_path required' });
    }
    const analysis = await analyzeJourney(req.user._id, current_path, normal_paths);
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai/status — AI service health
router.get('/status', async (req, res) => {
  const health = await checkHealth();
  res.json({ success: true, data: health });
});

module.exports = router;
