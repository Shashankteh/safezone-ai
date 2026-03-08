const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies
} = require('../utils/jwt');
const logger = require('../utils/logger');

// ─── @route   POST /api/auth/register ────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create user (password hashed in pre-save hook)
    const user = await User.create({ name, email, phone, password });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const { token: refreshToken, tokenId } = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshTokens.push({
      token: refreshToken,
      device: req.headers['user-agent'] || 'unknown'
    });
    user.lastLogin = new Date();
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    logger.info(`New user registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// ─── @route   POST /api/auth/login ───────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Try again in 2 hours.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const { token: refreshToken } = generateRefreshToken(user._id);

    // Clean old refresh tokens (keep max 5 devices)
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }

    // Save new refresh token
    user.refreshTokens.push({
      token: refreshToken,
      device: req.headers['user-agent'] || 'unknown'
    });
    user.lastLogin = new Date();
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    logger.info(`User logged in: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ─── @route   POST /api/auth/refresh-token ───────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please login again.'
      });
    }

    // Find user and check if token exists in DB
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const tokenExists = user.refreshTokens.some(rt => rt.token === token);

    if (!tokenExists) {
      // Token reuse detected — clear all tokens (security breach)
      user.refreshTokens = [];
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Token reuse detected. Please login again.'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);
    const { token: newRefreshToken } = generateRefreshToken(user._id);

    // Replace old refresh token with new one (rotation)
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
    user.refreshTokens.push({
      token: newRefreshToken,
      device: req.headers['user-agent'] || 'unknown'
    });
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// ─── @route   POST /api/auth/logout ──────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token && req.user) {
      // Remove this specific refresh token
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token } }
      });
    }

    clearTokenCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    // Still clear cookies even if DB update fails
    clearTokenCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
};

// ─── @route   GET /api/auth/me ───────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: { user: req.user.toSafeObject() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

// ─── @route   PUT /api/auth/update-profile ───────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, pushToken } = req.body;
    const allowedUpdates = {};

    if (name) allowedUpdates.name = name;
    if (phone) allowedUpdates.phone = phone;
    if (pushToken !== undefined) allowedUpdates.pushToken = pushToken;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { user: user.toSafeObject() }
    });

  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// ─── @route   PUT /api/auth/trusted-contacts ─────────────────────────────────
const updateTrustedContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'Contacts must be an array'
      });
    }

    if (contacts.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 trusted contacts allowed'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { trustedContacts: contacts },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Trusted contacts updated',
      data: { trustedContacts: user.trustedContacts }
    });

  } catch (error) {
    logger.error(`Update contacts error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Update failed' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  updateTrustedContacts
};
