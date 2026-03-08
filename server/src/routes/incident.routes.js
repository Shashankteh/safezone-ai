const express = require('express');
const router = express.Router();
const {
  reportIncident, getNearbyIncidents, upvoteIncident, getHeatmapData, getAllIncidents
} = require('../controllers/incidentController');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/report', protect, reportIncident);
router.get('/nearby', protect, getNearbyIncidents);
router.put('/:id/upvote', protect, upvoteIncident);
router.get('/heatmap', getHeatmapData);
router.get('/all', protect, adminOnly, getAllIncidents);

module.exports = router;