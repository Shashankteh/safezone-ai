const Location = require('../models/Location');
const User = require('../models/User');
const logger = require('../utils/logger');

// @route POST /api/location/update
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, altitude, speed, heading, battery, journeyId } = req.body;

    const locationData = {
      userId: req.user._id,
      coordinates: { lat, lng },
      geoLocation: {
        type: 'Point',
        coordinates: [lng, lat]  // GeoJSON: [longitude, latitude]
      },
      accuracy: accuracy || 0,
      altitude: altitude || null,
      speed: speed || 0,
      heading: heading || null,
      battery: battery || null,
      journeyId: journeyId || null,
      sharedWith: req.user.trustedContacts
        .filter(c => c.canViewLocation)
        .map(c => c._id)
    };

    const location = await Location.create(locationData);

    // Emit via Socket.io (handled in socket layer)
    req.app.get('io')?.to(`user_${req.user._id}`).emit('location:updated', {
      userId: req.user._id,
      lat, lng,
      timestamp: location.timestamp
    });

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      data: { locationId: location._id, timestamp: location.timestamp }
    });

  } catch (error) {
    logger.error(`Location update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

// @route GET /api/location/history
const getLocationHistory = async (req, res) => {
  try {
    const { limit = 50, hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const locations = await Location.find({
      userId: req.user._id,
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('coordinates timestamp speed accuracy');

    return res.status(200).json({
      success: true,
      data: { locations, count: locations.length }
    });

  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get history' });
  }
};

// @route GET /api/location/trusted-view
const getTrustedLocations = async (req, res) => {
  try {
    // Get IDs of contacts who share with this user
    const user = await User.findById(req.user._id);
    const contactIds = user.trustedContacts.map(c => c._id);

    const locations = await Location.find({
      userId: { $in: contactIds },
      isActive: true,
      timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 min
    })
      .populate('userId', 'name phone')
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      data: { locations }
    });

  } catch (error) {
    logger.error(`Get trusted locations error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get locations' });
  }
};

module.exports = { updateLocation, getLocationHistory, getTrustedLocations };
