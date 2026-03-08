const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Generate Access Token (15 min)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role,
      type: 'access'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'safezone-ai',
      audience: 'safezone-client'
    }
  );
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (userId) => {
  const tokenId = uuidv4();
  const token = jwt.sign(
    {
      id: userId,
      tokenId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'safezone-ai'
    }
  );
  return { token, tokenId };
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'safezone-ai',
      audience: 'safezone-client'
    });
  } catch (error) {
    logger.debug(`Access token verification failed: ${error.message}`);
    return null;
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'safezone-ai'
    });
  } catch (error) {
    logger.debug(`Refresh token verification failed: ${error.message}`);
    return null;
  }
};

// Set tokens in HTTP-only cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access token cookie (15 min)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000  // 15 minutes
  });

  // Refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  });
};

// Clear auth cookies
const clearTokenCookies = (res) => {
  res.cookie('accessToken', '', { maxAge: 0 });
  res.cookie('refreshToken', '', { maxAge: 0 });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies
};
