const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  // Center point of geofence
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  // Polygon coordinates for complex shapes
  polygon: [[Number]],
  // Circle radius (meters)
  radius: {
    type: Number,
    default: 200,  // 200 meters default
    min: 50,
    max: 10000
  },
  type: {
    type: String,
    enum: ['safe', 'danger', 'custom'],
    default: 'safe'
  },
  alertOnEnter: { type: Boolean, default: true },
  alertOnExit: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  color: { type: String, default: '#00FF88' },
  icon: { type: String, default: '🏠' }
}, {
  timestamps: true
});

geofenceSchema.index({ userId: 1 });

module.exports = mongoose.model('Geofence', geofenceSchema);
