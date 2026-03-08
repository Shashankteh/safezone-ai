require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit.middleware');

const authRoutes     = require('./routes/auth.routes');
const locationRoutes = require('./routes/location.routes');
const sosRoutes      = require('./routes/sos.routes');
const geofenceRoutes = require('./routes/geofence.routes');
const incidentRoutes = require('./routes/incident.routes');
const safetyRoutes   = require('./routes/safety.routes');
const adminRoutes    = require('./routes/admin.routes');
const aiRoutes       = require('./routes/ai.routes');
const setupSockets   = require('./socket/locationSocket');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);
setupSockets(io);

connectDB();
connectRedis();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://safezoneai.vercel.app',
      'https://safezone-ai-five.vercel.app',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: '🛡️ SafeZone AI v2.0 running',
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    uptime: Math.round(process.uptime()) + 's'
  });
});

app.use('/api/auth',     authRoutes);
app.use('/api/location', locationRoutes.locationRouter || locationRoutes);
app.use('/api/sos',      sosRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/incident', incidentRoutes);
app.use('/api/safety',   safetyRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/ai',       aiRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }
  return res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🛡️  SafeZone AI v2.0 running on port ${PORT}`);
  logger.info(`📋 Routes: auth, location, sos, geofence, incident, safety, admin, ai`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  server.close(() => process.exit(0));
});

module.exports = { app, server };