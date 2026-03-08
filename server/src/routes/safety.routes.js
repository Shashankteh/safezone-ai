const express = require('express');
const router = express.Router();
const { getSafetyScore, getSafeRouteHandler, getNearbyHelp, getSafetyOverview } = require('../controllers/safetyController');
const { protect } = require('../middleware/auth.middleware');

router.get('/score', protect, getSafetyScore);
router.post('/route', protect, getSafeRouteHandler);
router.get('/nearby-help', protect, getNearbyHelp);
router.get('/overview', protect, getSafetyOverview);

module.exports = router;
