const express = require('express');
const locationRouter = express.Router();
const sosRouter = express.Router();

const { updateLocation, getLocationHistory, getTrustedLocations } = require('../controllers/locationController');
const { triggerSOS, cancelSOS, getSOSHistory } = require('../controllers/sosController');
const { protect } = require('../middleware/auth.middleware');
const { locationLimiter, sosLimiter } = require('../middleware/rateLimit.middleware');
const { locationValidation } = require('../middleware/validate.middleware');

// Location routes (all protected)
locationRouter.post('/update', protect, locationLimiter, locationValidation, updateLocation);
locationRouter.get('/history', protect, getLocationHistory);
locationRouter.get('/trusted-view', protect, getTrustedLocations);

// SOS routes (all protected)
sosRouter.post('/trigger', protect, sosLimiter, triggerSOS);
sosRouter.post('/cancel', protect, cancelSOS);
sosRouter.get('/history', protect, getSOSHistory);

module.exports = { locationRouter, sosRouter };
