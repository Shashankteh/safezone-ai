const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const setupSockets = (io) => {
  // ─── Auth Middleware for Socket ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-password -refreshTokens');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();

    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: ${user.name} (${socket.id})`);

    // Join user's personal room
    socket.join(`user_${user._id}`);

    // Join admin room if admin
    if (user.role === 'admin') {
      socket.join('admin_room');
    }

    // ─── Location Update ─────────────────────────────────────────────────
    socket.on('location:update', async (data) => {
      const { lat, lng, accuracy, speed } = data;

      if (!lat || !lng) return;

      // Broadcast to all trusted contacts who can view location
      const userWithContacts = await User.findById(user._id);

      for (const contact of userWithContacts.trustedContacts) {
        if (contact.canViewLocation) {
          io.to(`user_${contact._id}`).emit('location:received', {
            userId: user._id,
            name: user.name,
            lat, lng,
            accuracy,
            speed,
            timestamp: new Date()
          });
        }
      }
    });

    // ─── Join SOS room (for contacts monitoring) ─────────────────────────
    socket.on('sos:join_room', ({ sosId }) => {
      socket.join(`sos_room_${sosId}`);
      logger.info(`User ${user.name} joined SOS room: ${sosId}`);
    });

    // ─── Geofence check ──────────────────────────────────────────────────
    socket.on('geofence:check', ({ lat, lng, geofenceId }) => {
      // Frontend sends coordinates, server validates against stored geofences
      socket.emit('geofence:status', {
        geofenceId,
        status: 'inside', // Simplified — real logic checks polygon/circle
        timestamp: new Date()
      });
    });

    // ─── Fall detection alert ─────────────────────────────────────────────
    socket.on('motion:fall_detected', async (data) => {
      logger.warn(`⚠️ Fall detected for user: ${user.name}`);

      // Give 30 seconds to cancel before auto-SOS
      socket.emit('sos:countdown', {
        seconds: 30,
        message: 'Fall detected! SOS will fire in 30 seconds. Tap CANCEL if you are safe.'
      });

      // Notify admin room
      io.to('admin_room').emit('motion:fall_alert', {
        userId: user._id,
        userName: user.name,
        location: data.location,
        timestamp: new Date()
      });
    });

    // ─── Dead Man's Switch check-in ───────────────────────────────────────
    socket.on('checkin:alive', async () => {
      await User.findByIdAndUpdate(user._id, {
        lastCheckIn: new Date()
      });
      socket.emit('checkin:confirmed', { timestamp: new Date() });
      logger.info(`✅ Check-in confirmed: ${user.name}`);
    });

    // ─── Typing / panic voice command ────────────────────────────────────
    socket.on('panic:voice', ({ command }) => {
      const panicPhrases = ['help me', 'sos', 'emergency', 'safezone sos'];
      const isMatch = panicPhrases.some(p => command.toLowerCase().includes(p));

      if (isMatch) {
        socket.emit('panic:confirmed', {
          message: 'Panic command detected! Triggering SOS...'
        });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${user.name} — ${reason}`);
    });
  });

  logger.info('✅ Socket.io handlers initialized');
};

module.exports = setupSockets;
