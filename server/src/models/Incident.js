const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['theft', 'assault', 'harassment', 'accident', 'suspicious', 'other'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  geoLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  severity: {
    type: Number,
    enum: [1, 2, 3],  // 1=low, 2=medium, 3=high
    default: 1
  },
  verified: { type: Boolean, default: false },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mediaUrl: { type: String, default: null },
  anonymous: { type: Boolean, default: false }
}, {
  timestamps: true
});

incidentSchema.index({ geoLocation: '2dsphere' });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
