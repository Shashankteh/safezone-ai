const express = require('express');
const router = express.Router();
const { createGeofence, getGeofences, updateGeofence, deleteGeofence, checkGeofenceBreach } = require('../controllers/geofenceController');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createGeofence);
router.get('/', protect, getGeofences);
router.put('/:id', protect, updateGeofence);
router.delete('/:id', protect, deleteGeofence);
router.post('/check', protect, checkGeofenceBreach);

module.exports = router;
