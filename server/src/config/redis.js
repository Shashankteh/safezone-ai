const logger = require('../utils/logger');

// Redis is optional — graceful fallback if not configured
let redisClient = null;
let isRedisAvailable = false;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not set — Redis disabled (using in-memory fallback)');
    return null;
  }

  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
      isRedisAvailable = false;
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis connected');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.warn(`Redis connection failed: ${err.message}. Running without Redis.`);
    return null;
  }
};

// ── In-memory fallback cache ──────────────────────────────────────────────────
const memCache = new Map();

const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      return await redisClient.get(key);
    }
    const item = memCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ttlSeconds = 300) {
    if (isRedisAvailable && redisClient) {
      return await redisClient.setEx(key, ttlSeconds, value);
    }
    memCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
  },

  async del(key) {
    if (isRedisAvailable && redisClient) {
      return await redisClient.del(key);
    }
    memCache.delete(key);
  },

  async flush() {
    if (isRedisAvailable && redisClient) {
      return await redisClient.flushAll();
    }
    memCache.clear();
  }
};

module.exports = { connectRedis, cache, redisClient: () => redisClient };
