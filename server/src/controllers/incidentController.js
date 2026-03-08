const Incident = require('../models/Incident');
const SafetyScore = require('../models/SafetyScore');
const User = require('../models/User');
const Location = require('../models/Location');
const logger = require('../utils/logger');
const { sendIncidentPush } = require('../services/pushService');

// ── Haversine ─────────────────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// @desc  Report a new incident
// @route POST /api/incident/report
const reportIncident = async (req, res) => {
  try {
    const { type, description, lat, lng, severity = 2, address } = req.body;

    if (!lat || !lng || !type) {
      return res.status(400).json({ success: false, message: 'type, lat, lng required' });
    }

    const incident = await Incident.create({
      reportedBy: req.user._id,
      type,
      description,
      coordinates: { lat, lng, address: address || '' },
      severity,
      verified: false,
      upvotes: 0,
      upvotedBy: []
    });

    // Update safety score for this area
    await SafetyScore.recalculateScore(lat, lng, severity);

    // Notify nearby active users via Socket.io
    const io = req.app.get('io');
    const ALERT_RADIUS = 1000; // 1km

    // Find recently active locations near incident
    const recentLocations = await Location.find({
      isActive: true,
      timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // last 10 mins
    }).populate('userId', 'name pushToken');

    let nearbyNotified = 0;
    for (const loc of recentLocations) {
      if (!loc.userId || String(loc.userId._id) === String(req.user._id)) continue;
      const dist = haversine(lat, lng, loc.coordinates.lat, loc.coordinates.lng);
      if (dist <= ALERT_RADIUS) {
        // Socket alert
        io?.to(`user_${loc.userId._id}`).emit('nearby:incident', {
          incidentId: incident._id,
          type,
          severity,
          distance: dist,
          coordinates: { lat, lng }
        });

        // Push notification
        if (loc.userId.pushToken) {
          await sendIncidentPush({
            pushToken: loc.userId.pushToken,
            incidentType: type,
            distance: dist,
            severity
          });
        }
        nearbyNotified++;
      }
    }

    // Broadcast to admin room
    io?.to('admin_room').emit('incident:new', {
      incidentId: incident._id,
      type,
      severity,
      coordinates: { lat, lng }
    });

    logger.info(`Incident reported: ${type} at [${lat},${lng}] — ${nearbyNotified} nearby users notified`);

    return res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: { incident, nearbyNotified }
    });
  } catch (err) {
    logger.error(`Report incident error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to report incident' });
  }
};

// @desc  Get nearby incidents
// @route GET /api/incident/nearby?lat=&lng=&radius=
const getNearbyIncidents = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius);

    // Get incidents from last 48 hours
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const incidents = await Incident.find({
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('reportedBy', 'name');

    // Filter by radius
    const nearby = incidents
      .map(inc => ({
        ...inc.toObject(),
        distance: haversine(parsedLat, parsedLng, inc.coordinates.lat, inc.coordinates.lng)
      }))
      .filter(inc => inc.distance <= parsedRadius)
      .sort((a, b) => a.distance - b.distance);

    return res.status(200).json({
      success: true,
      data: { incidents: nearby, count: nearby.length }
    });
  } catch (err) {
    logger.error(`Get nearby incidents error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get incidents' });
  }
};

// @desc  Upvote / verify incident
// @route PUT /api/incident/:id/upvote
const upvoteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const userId = String(req.user._id);
    if (incident.upvotedBy?.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already upvoted' });
    }

    incident.upvotes += 1;
    incident.upvotedBy = [...(incident.upvotedBy || []), userId];

    // Auto-verify after 3 upvotes
    if (incident.upvotes >= 3) {
      incident.verified = true;
    }

    await incident.save();

    return res.status(200).json({
      success: true,
      data: { upvotes: incident.upvotes, verified: incident.verified }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to upvote incident' });
  }
};

// @desc  Get heatmap data (all incidents, grouped by grid)
// @route GET /api/incident/heatmap
const getHeatmapData = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const incidents = await Incident.find({
      timestamp: { $gte: since }
    }).select('coordinates severity timestamp type');

    // Format for heatmap — [lat, lng, intensity]
    const heatmapPoints = incidents.map(inc => ({
      lat: inc.coordinates.lat,
      lng: inc.coordinates.lng,
      intensity: inc.severity, // 1-3
      type: inc.type,
      timestamp: inc.timestamp
    }));

    // Also get safety scores for the map overlay
    const safetyScores = await SafetyScore.find().select('coordinates score riskLevel gridKey').limit(500);

    return res.status(200).json({
      success: true,
      data: {
        heatmapPoints,
        safetyScores,
        totalIncidents: incidents.length
      }
    });
  } catch (err) {
    logger.error(`Heatmap error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get heatmap data' });
  }
};

// @desc  Get all incidents (admin)
// @route GET /api/incident/all
const getAllIncidents = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, severity, verified } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = parseInt(severity);
    if (verified !== undefined) filter.verified = verified === 'true';

    const total = await Incident.countDocuments(filter);
    const incidents = await Incident.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email');

    return res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get incidents' });
  }
};

module.exports = { reportIncident, getNearbyIncidents, upvoteIncident, getHeatmapData, getAllIncidents };
