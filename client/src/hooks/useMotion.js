import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

const FALL_THRESHOLD = 25; // m/s² — sudden deceleration
const IMPACT_WINDOW = 500; // ms

export const useMotion = ({ enabled = false, onFallDetected } = {}) => {
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const highAccelTimeRef = useRef(null);

  const handleMotion = useCallback((event) => {
    const { accelerationIncludingGravity: accel } = event;
    if (!accel) return;

    const magnitude = Math.sqrt(
      Math.pow(accel.x || 0, 2) +
      Math.pow(accel.y || 0, 2) +
      Math.pow(accel.z || 0, 2)
    );

    const prev = lastAccelRef.current;
    const prevMag = Math.sqrt(prev.x ** 2 + prev.y ** 2 + prev.z ** 2);
    const delta = Math.abs(magnitude - prevMag);

    lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };

    // High acceleration detected
    if (magnitude > FALL_THRESHOLD) {
      highAccelTimeRef.current = Date.now();
    }

    // Sudden drop after high acceleration = fall
    if (
      highAccelTimeRef.current &&
      Date.now() - highAccelTimeRef.current < IMPACT_WINDOW &&
      magnitude < 5 // near free-fall
    ) {
      highAccelTimeRef.current = null;
      console.warn('🆘 Fall detected!');
      onFallDetected?.();

      // Notify socket
      const socket = getSocket();
      socket?.emit('motion:fall_detected', {
        location: null, // Will be filled by safety context
        timestamp: new Date()
      });
    }
  }, [onFallDetected]);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      // iOS 13+ requires permission
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    }
    return true; // Android/desktop — no permission needed
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const setup = async () => {
      const granted = await requestPermission();
      if (granted) {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    setup();
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, handleMotion, requestPermission]);

  return { requestPermission };
};
