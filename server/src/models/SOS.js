const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggerType: {
    type: String,
    enum: ['manual', 'voice', 'fall_detection', 'dead_mans_switch', 'geofence'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active'
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  message: {
    type: String,
    default: 'SOS! I need help!'
  },
  // Who was notified
  notifiedContacts: [{
    contactId: String,
    name: String,
    phone: String,
    smsSent: Boolean,
    pushSent: Boolean,
    sentAt: Date
  }],
  // Response tracking
  resolvedAt: Date,
  resolvedBy: {
    type: String,
    enum: ['user', 'contact', 'auto'],
    default: null
  },
  notes: String
}, {
  timestamps: true
});

sosSchema.index({ userId: 1, createdAt: -1 });
sosSchema.index({ status: 1 });

module.exports = mongoose.model('SOS', sosSchema);
