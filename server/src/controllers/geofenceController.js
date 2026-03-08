const Geofence = require('../models/Geofence');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendGeofenceAlert } = require('../services/smsService');
const { sendGeofencePush } = require('../services/pushService');

// ── Haversine distance helper ─────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Point-in-polygon (ray casting) ────────────────────────────────────────────
const pointInPolygon = (lat, lng, polygon) => {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// @desc  Create geofence
// @route POST /api/geofence
const createGeofence = async (req, res) => {
  try {
    const { name, type, coordinates, radius, alertOnEnter, alertOnExit, center } = req.body;

    if (!coordinates?.length && !center) {
      return res.status(400).json({ success: false, message: 'Coordinates or center required' });
    }

    const geofence = await Geofence.create({
      userId: req.user._id,
      name,
      type: type || 'safe',
      coordinates: coordinates || [],
      center: center || null,
      radius: radius || 200,
      alertOnEnter: alertOnEnter !== false,
      alertOnExit: alertOnExit !== false,
      active: true
    });

    // Link to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { geofences: geofence._id }
    });

    logger.info(`Geofence created: ${name} by user ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      data: { geofence }
    });
  } catch (err) {
    logger.error(`Create geofence error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to create geofence' });
  }
};

// @desc  Get all geofences for user
// @route GET /api/geofence
const getGeofences = async (req, res) => {
  try {
    const geofences = await Geofence.find({
      userId: req.user._id,
      active: true
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { geofences, count: geofences.length }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get geofences' });
  }
};

// @desc  Update geofence
// @route PUT /api/geofence/:id
const updateGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }

    return res.status(200).json({ success: true, data: { geofence } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update geofence' });
  }
};

// @desc  Delete geofence
// @route DELETE /api/geofence/:id
const deleteGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { active: false },
      { new: true }
    );

    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { geofences: geofence._id }
    });

    return res.status(200).json({ success: true, message: 'Geofence deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete geofence' });
  }
};

// @desc  Check if location breaches any geofence
// @route POST /api/geofence/check
const checkGeofenceBreach = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;

    const geofences = await Geofence.find({ userId, active: true });
    const breaches = [];

    for (const fence of geofences) {
      let isInside = false;

      if (fence.center && fence.radius) {
        // Circular geofence
        const dist = haversine(lat, lng, fence.center.lat, fence.center.lng);
        isInside = dist <= fence.radius;
      } else if (fence.coordinates?.length >= 3) {
        // Polygon geofence
        isInside = pointInPolygon(lat, lng, fence.coordinates);
      }

      const wasInside = fence.lastStatus === 'inside';

      if (isInside && !wasInside && fence.alertOnEnter) {
        breaches.push({ fence, type: 'enter' });
        await Geofence.findByIdAndUpdate(fence._id, { lastStatus: 'inside', lastChecked: new Date() });
      } else if (!isInside && wasInside && fence.alertOnExit) {
        breaches.push({ fence, type: 'exit' });
        await Geofence.findByIdAndUpdate(fence._id, { lastStatus: 'outside', lastChecked: new Date() });
      } else {
        await Geofence.findByIdAndUpdate(fence._id, { lastChecked: new Date() });
      }
    }

    // Fire alerts for breaches
    if (breaches.length) {
      const user = await User.findById(userId);
      const io = req.app.get('io');

      for (const { fence, type } of breaches) {
        // Socket alert
        io?.to(`user_${userId}`).emit('geofence:breach', {
          fenceId: fence._id,
          name: fence.name,
          type: fence.type,
          breachType: type,
          timestamp: new Date()
        });

        // SMS + push to trusted contacts
        for (const contact of user.trustedContacts || []) {
          if (!contact.notifyOnGeofence) continue;

          await sendGeofenceAlert({
            toPhone: contact.phone,
            userName: user.name,
            zoneName: fence.name,
            breachType: type,
            lat, lng
          });

          if (contact.pushToken) {
            await sendGeofencePush({
              pushToken: contact.pushToken,
              userName: user.name,
              zoneName: fence.name,
              breachType: type
            });
          }
        }

        logger.info(`Geofence breach: user ${user.email} ${type} "${fence.name}"`);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        breachCount: breaches.length,
        breaches: breaches.map(b => ({ name: b.fence.name, type: b.type, fenceType: b.fence.type }))
      }
    });
  } catch (err) {
    logger.error(`Geofence check error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Geofence check failed' });
  }
};

module.exports = { createGeofence, getGeofences, updateGeofence, deleteGeofence, checkGeofenceBreach };
