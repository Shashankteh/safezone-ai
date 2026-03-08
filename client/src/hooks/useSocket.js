import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (userId, token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const listenersRef = useRef({});

  useEffect(() => {
    if (!userId || !token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('join:room', { userId });
      socket.emit('join:room', { roomId: `user_${userId}` });
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      setIsConnected(false);
    });

    // Re-attach any pending listeners
    Object.entries(listenersRef.current).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId, token]);

  const on = useCallback((event, handler) => {
    listenersRef.current[event] = handler;
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event) => {
    delete listenersRef.current[event];
    socketRef.current?.off(event);
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, connectionError, on, off, emit };
};
