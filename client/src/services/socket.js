import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// ─── Location helpers ────────────────────────────────────────────────────────
export const emitLocation = (lat, lng, extra = {}) => {
  socket?.emit('location:update', { lat, lng, ...extra });
};

export const emitFallDetected = (location) => {
  socket?.emit('motion:fall_detected', { location });
};

export const emitCheckIn = () => {
  socket?.emit('checkin:alive');
};

export const emitPanicVoice = (command) => {
  socket?.emit('panic:voice', { command });
};

export default { connectSocket, disconnectSocket, getSocket, emitLocation };
