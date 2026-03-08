import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const SafetyContext = createContext();

export const SafetyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [safetyScore, setSafetyScore] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const watchIdRef = useRef(null);

  // Fetch trusted contacts
  const fetchContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/safety/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data?.data?.contacts || []);
      }
    } catch (err) {
      console.warn('Could not fetch contacts:', err.message);
    }
  }, [isAuthenticated]);

  // Start location sharing
  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now()
        };
        setLocation(loc);

        // Send to backend
        if (isAuthenticated) {
          const token = localStorage.getItem('accessToken');
          fetch(`${API}/location/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(loc)
          }).catch(() => {});
        }
      },
      (err) => console.warn('Location error:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [isAuthenticated]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  }, []);

  // Trigger SOS
  const triggerSOS = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('accessToken');
      const body = location
        ? { lat: location.lat, lng: location.lng, message: 'Emergency SOS triggered' }
        : { message: 'Emergency SOS triggered' };

      await fetch(`${API}/sos/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      setSosActive(true);
    } catch (err) {
      console.error('SOS trigger error:', err);
    }
  }, [isAuthenticated, location]);

  // Cancel SOS
  const cancelSOS = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API}/sos/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSosActive(false);
    } catch (err) {
      console.error('Cancel SOS error:', err);
    }
  }, [isAuthenticated]);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          setLocation(loc);
          resolve(loc);
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Init on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      getCurrentLocation().catch(() => {});
    } else {
      stopLocationSharing();
      setSosActive(false);
    }
  }, [isAuthenticated]);

  // Cleanup
  useEffect(() => {
    return () => stopLocationSharing();
  }, []);

  return (
    <SafetyContext.Provider value={{
      location,
      isSharing,
      sosActive,
      safetyScore,
      contacts,
      nearbyIncidents,
      startLocationSharing,
      stopLocationSharing,
      triggerSOS,
      cancelSOS,
      getCurrentLocation,
      fetchContacts,
      setSafetyScore,
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

export default SafetyContext;
