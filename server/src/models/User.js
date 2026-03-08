const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trustedContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    required: [true, 'Contact phone is required'],
    match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  relationship: {
    type: String,
    enum: ['family', 'friend', 'colleague', 'other'],
    default: 'other'
  },
  notifyOnSOS: { type: Boolean, default: true },
  notifyOnGeofence: { type: Boolean, default: false },
  canViewLocation: { type: Boolean, default: true }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Never return password in queries
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  trustedContacts: {
    type: [trustedContactSchema],
    validate: {
      validator: function(contacts) {
        return contacts.length <= 5; // Max 5 trusted contacts
      },
      message: 'Maximum 5 trusted contacts allowed'
    }
  },
  geofences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence'
  }],
  safetyScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  pushToken: {
    type: String,
    default: null
  },
  // Dead Man's Switch
  checkInInterval: {
    type: Number,     // minutes
    default: null     // null = disabled
  },
  lastCheckIn: {
    type: Date,
    default: null
  },
  checkInActive: {
    type: Boolean,
    default: false
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Password reset
  passwordResetToken: String,
  passwordResetExpire: Date,
  // Refresh tokens (array for multi-device)
  refreshTokens: [{
    token: String,
    device: String,
    createdAt: { type: Date, default: Date.now }
  }],
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// ─── Virtual: isLocked ──────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save: Hash password ─────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: Compare password ────────────────────────────────────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Increment login attempts ───────────────────────────────────────
userSchema.methods.incLoginAttempts = async function() {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return await this.updateOne(updates);
};

// ─── Method: Safe user object (no sensitive fields) ──────────────────────────
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.passwordResetToken;
  delete user.passwordResetExpire;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model('User', userSchema);
