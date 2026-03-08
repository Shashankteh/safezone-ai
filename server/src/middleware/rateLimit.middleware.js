const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Auth routes - lenient in dev
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window (was 15 min)
  max: isDev ? 1000 : 10,  // 1000 in dev, 10 in production
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please try again in a minute.' }
});

// SOS route - very lenient (emergency use)
const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { success: false, message: 'SOS rate limit exceeded.' }
});

// Location updates
const locationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 10000 : 60,
  message: { success: false, message: 'Location update rate limit exceeded.' }
});

module.exports = { apiLimiter, authLimiter, sosLimiter, locationLimiter };
