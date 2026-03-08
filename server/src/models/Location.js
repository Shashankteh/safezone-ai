const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Coordinates stored encrypted
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  // GeoJSON for MongoDB geospatial queries
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [lng, lat] — GeoJSON format
      required: true
    }
  },
  accuracy: { type: Number, default: 0 },       // meters
  altitude: { type: Number, default: null },
  speed: { type: Number, default: 0 },           // m/s
  heading: { type: Number, default: null },       // degrees
  battery: { type: Number, default: null },       // 0-100
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: { type: Boolean, default: true },
  // For journey anomaly detection
  journeyId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Geospatial index for nearby queries
locationSchema.index({ geoLocation: '2dsphere' });
locationSchema.index({ userId: 1, timestamp: -1 });

// Auto-expire old locations after 24 hours
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Location', locationSchema);
