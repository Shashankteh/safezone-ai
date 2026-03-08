import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { sosAPI, locationAPI } from '../services/api';
import toast from 'react-hot-toast';

const SafetyContext = createContext(null);

export const SafetyProvider = ({ children }) => {
  const [myLocation, setMyLocation] = useState(null);
  const [trustedLocations, setTrustedLocations] = useState([]);
  const [sosActive, setSosActive] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Setup socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Receive SOS alert from a trusted contact
    socket.on('sos:alert', (data) => {
      toast.error(`🚨 SOS from ${data.from.name}!`, {
        duration: 10000,
        style: { background: '#1a0a14', border: '1px solid #ff3366', color: 'white' }
      });
      setNearbyAlerts(prev => [data, ...prev].slice(0, 10));
    });

    // Receive location from trusted contact
    socket.on('location:received', (data) => {
      setTrustedLocations(prev => {
        const filtered = prev.filter(l => l.userId !== data.userId);
        return [...filtered, data];
      });
    });

    // SOS countdown (fall detection)
    socket.on('sos:countdown', (data) => {
      toast(`⚠️ ${data.message}`, {
        duration: data.seconds * 1000,
        style: { background: '#1a1400', border: '1px solid #ffaa00', color: 'white' }
      });
    });

    // Geofence breach
    socket.on('geofence:breach', (data) => {
      toast.error(`🔔 Geofence: ${data.zoneName} — ${data.type}`, { duration: 5000 });
    });

    return () => {
      socket.off('sos:alert');
      socket.off('location:received');
      socket.off('sos:countdown');
      socket.off('geofence:breach');
    };
  }, []);

  // Start live location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setIsSharing(true);
    const socket = getSocket();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy, speed, altitude, heading } = position.coords;
        const locationData = { lat, lng, accuracy, speed, altitude, heading };

        setMyLocation({ lat, lng, accuracy, timestamp: Date.now() });
        setLocationError(null);

        // Emit via socket (real-time)
        socket?.emit('location:update', locationData);
      },
      (err) => {
        setLocationError(err.message);
        setIsSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Also save to DB every 30 seconds
    locationIntervalRef.current = setInterval(async () => {
      if (myLocation) {
        try {
          await locationAPI.update(myLocation);
        } catch (e) {
          console.error('Location save failed:', e);
        }
      }
    }, 30000);

  }, [myLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    setIsSharing(false);
  }, []);

  // Trigger SOS
  const triggerSOS = useCallback(async (message = '') => {
    try {
      const res = await sosAPI.trigger({
        lat: myLocation?.lat,
        lng: myLocation?.lng,
        message: message || 'SOS! I need immediate help!',
        triggerType: 'manual'
      });
      setSosActive(true);
      setSosId(res.data.data.sosId);
      toast.error('🚨 SOS Activated! Notifying contacts...', {
        duration: 5000,
        style: { background: '#1a0a14', border: '1px solid #ff3366', color: 'white' }
      });
      return res.data.data;
    } catch (err) {
      toast.error('Failed to trigger SOS');
      throw err;
    }
  }, [myLocation]);

  // Cancel SOS
  const cancelSOS = useCallback(async () => {
    if (!sosId) return;
    try {
      await sosAPI.cancel(sosId);
      setSosActive(false);
      setSosId(null);
      toast.success('✅ SOS Cancelled — You are marked as safe');
    } catch (err) {
      toast.error('Failed to cancel SOS');
    }
  }, [sosId]);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation({ ...loc, accuracy: pos.coords.accuracy, timestamp: Date.now() });
          resolve(loc);
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return (
    <SafetyContext.Provider value={{
      myLocation, trustedLocations, sosActive, sosId,
      isSharing, locationError, nearbyAlerts,
      startTracking, stopTracking,
      triggerSOS, cancelSOS, getCurrentLocation
    }}>
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
};
