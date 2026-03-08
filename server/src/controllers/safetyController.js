const SafetyScore = require('../models/SafetyScore');
const Incident = require('../models/Incident');
const { getSafeRoute, findNearbyPlaces, haversineDistance } = require('../services/mapsService');
const logger = require('../utils/logger');

// @desc  Get safety score for a location
// @route GET /api/safety/score?lat=&lng=
const getSafetyScore = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Get DB score
    const cell = await SafetyScore.getOrCreateGrid(parsedLat, parsedLng);

    // Get recent incidents in 500m
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentIncidents = await Incident.find({ timestamp: { $gte: since } })
      .select('coordinates severity type timestamp');

    const nearby = recentIncidents.filter(inc => {
      const dist = haversineDistance(parsedLat, parsedLng, inc.coordinates.lat, inc.coordinates.lng);
      return dist <= 500;
    });

    // Recalculate live score
    let liveScore = cell.score;
    nearby.forEach(inc => {
      const penalties = { 1: 1, 2: 3, 3: 6 };
      liveScore -= (penalties[inc.severity] || 3);
    });
    liveScore = Math.max(0, Math.min(100, liveScore));

    const riskLevel = liveScore >= 70 ? 'Low' : liveScore >= 40 ? 'Medium' : 'High';
    const safetyAdvice = getSafetyAdvice(riskLevel, nearby);

    return res.status(200).json({
      success: true,
      data: {
        score: Math.round(liveScore),
        riskLevel,
        recentIncidents: nearby.length,
        factors: cell.factors,
        safetyAdvice,
        lastUpdated: cell.lastUpdated
      }
    });
  } catch (err) {
    logger.error(`Safety score error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get safety score' });
  }
};

// @desc  Get safe route recommendation
// @route POST /api/safety/route
const getSafeRouteHandler = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng, mode } = req.body;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, message: 'Origin and destination required' });
    }

    const result = await getSafeRoute({ originLat, originLng, destLat, destLng, mode });

    if (!result.success) {
      // Return a basic direct route when Maps API not configured
      return res.status(200).json({
        success: true,
        data: {
          routes: [{
            summary: 'Direct Route',
            distance: { text: 'Unknown', value: 0 },
            duration: { text: 'Unknown', value: 0 },
            steps: [],
            polyline: null
          }],
          message: 'Google Maps not configured — install API key for live routes'
        }
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    logger.error(`Safe route error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get route' });
  }
};

// @desc  Find nearby police / hospitals / pharmacies
// @route GET /api/safety/nearby-help?lat=&lng=&type=
const getNearbyHelp = async (req, res) => {
  try {
    const { lat, lng, type = 'police' } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const validTypes = ['police', 'hospital', 'pharmacy', 'fire_station'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await findNearbyPlaces({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      type,
      radius: 3000
    });

    return res.status(200).json({
      success: true,
      data: result.places || [],
      message: result.reason || null
    });
  } catch (err) {
    logger.error(`Nearby help error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to find nearby help' });
  }
};

// @desc  Get safety overview for user's area
// @route GET /api/safety/overview?lat=&lng=
const getSafetyOverview = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Incidents in last 7 days within 2km
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const incidents = await Incident.find({ timestamp: { $gte: since } });

    const nearby = incidents.filter(inc => {
      return haversineDistance(parsedLat, parsedLng, inc.coordinates.lat, inc.coordinates.lng) <= 2000;
    });

    const byType = nearby.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = nearby.reduce((acc, inc) => {
      const key = inc.severity === 3 ? 'high' : inc.severity === 2 ? 'medium' : 'low';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    return res.status(200).json({
      success: true,
      data: {
        totalIncidents: nearby.length,
        byType,
        bySeverity,
        radius: '2km',
        period: '7 days'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get safety overview' });
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────
const getSafetyAdvice = (riskLevel, incidents) => {
  const types = incidents.map(i => i.type);
  const advice = [];

  if (riskLevel === 'High') {
    advice.push('⚠️ High-risk area — consider alternative route');
    advice.push('📱 Share your location with trusted contacts');
    advice.push('🚨 Keep SOS ready');
  } else if (riskLevel === 'Medium') {
    advice.push('Stay aware of your surroundings');
    advice.push('Travel in groups if possible');
  } else {
    advice.push('✅ Area appears safe — stay alert');
  }

  if (types.includes('theft')) advice.push('Keep valuables secured — theft reported nearby');
  if (types.includes('assault')) advice.push('Stay in well-lit, populated areas');

  return advice;
};

module.exports = { getSafetyScore, getSafeRouteHandler, getNearbyHelp, getSafetyOverview };
