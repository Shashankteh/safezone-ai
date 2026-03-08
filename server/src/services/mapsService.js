const axios = require('axios');
const logger = require('../utils/logger');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OPENCAGE_KEY  = process.env.OPENCAGE_API_KEY;

// ── Reverse Geocode: coordinates → address ────────────────────────────────────
const reverseGeocode = async (lat, lng) => {
  // Try Google Maps first
  if (MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
      const { data } = await axios.get(url, { timeout: 5000 });
      if (data.status === 'OK' && data.results[0]) {
        return {
          success: true,
          address: data.results[0].formatted_address,
          components: data.results[0].address_components
        };
      }
    } catch (err) {
      logger.warn(`Google geocode failed, trying OpenCage: ${err.message}`);
    }
  }

  // Fallback to OpenCage (free tier)
  if (OPENCAGE_KEY) {
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_KEY}&no_annotations=1&limit=1`;
      const { data } = await axios.get(url, { timeout: 5000 });
      if (data.results?.[0]) {
        return { success: true, address: data.results[0].formatted };
      }
    } catch (err) {
      logger.warn(`OpenCage geocode failed: ${err.message}`);
    }
  }

  return { success: false, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
};

// ── Get Safe Route ────────────────────────────────────────────────────────────
const getSafeRoute = async ({ originLat, originLng, destLat, destLng, mode = 'walking' }) => {
  if (!MAPS_API_KEY) {
    logger.warn('Google Maps not configured — route disabled');
    return { success: false, reason: 'Maps API not configured' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${mode}&alternatives=true&key=${MAPS_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 8000 });

    if (data.status !== 'OK') {
      return { success: false, reason: data.status };
    }

    const routes = data.routes.map((route, i) => ({
      index: i,
      summary: route.summary,
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      steps: route.legs[0].steps.map(s => ({
        instruction: s.html_instructions.replace(/<[^>]+>/g, ''),
        distance: s.distance,
        duration: s.duration,
        startLat: s.start_location.lat,
        startLng: s.start_location.lng,
        endLat: s.end_location.lat,
        endLng: s.end_location.lng
      })),
      polyline: route.overview_polyline.points
    }));

    return { success: true, routes, recommendedIndex: 0 };
  } catch (err) {
    logger.error(`Route API failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Find Nearby Places (Police / Hospital / etc.) ─────────────────────────────
const findNearbyPlaces = async ({ lat, lng, type, radius = 2000 }) => {
  if (!MAPS_API_KEY) {
    return { success: false, reason: 'Maps API not configured', places: [] };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${MAPS_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 8000 });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return { success: false, reason: data.status, places: [] };
    }

    const places = (data.results || []).slice(0, 5).map(p => ({
      name: p.name,
      address: p.vicinity,
      rating: p.rating,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      placeId: p.place_id,
      isOpen: p.opening_hours?.open_now,
      distance: haversineDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng)
    }));

    places.sort((a, b) => a.distance - b.distance);
    return { success: true, places };
  } catch (err) {
    logger.error(`Nearby places failed: ${err.message}`);
    return { success: false, error: err.message, places: [] };
  }
};

// ── Haversine Distance ────────────────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ── Static Map Image URL ──────────────────────────────────────────────────────
const getStaticMapUrl = ({ lat, lng, zoom = 15, width = 400, height = 300, marker = true }) => {
  if (!MAPS_API_KEY) return null;
  const markerParam = marker ? `&markers=color:red%7C${lat},${lng}` : '';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}${markerParam}&key=${MAPS_API_KEY}`;
};

module.exports = { reverseGeocode, getSafeRoute, findNearbyPlaces, haversineDistance, getStaticMapUrl };
