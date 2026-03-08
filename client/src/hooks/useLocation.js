import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000
};

export const useLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const watchIdRef = useRef(null);

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const onSuccess = useCallback((position) => {
    const { latitude: lat, longitude: lng, accuracy, speed, heading, altitude } = position.coords;
    setLocation({ lat, lng, accuracy, speed, heading, altitude, timestamp: position.timestamp });
    setLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    setError(err.message);
    setLoading(false);
    if (err.code === err.PERMISSION_DENIED) setPermissionStatus('denied');
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(onSuccess, onError, mergedOptions);

    // Watch for updates
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, mergedOptions);
    setPermissionStatus('granted');
  }, [onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        permission.onchange = () => setPermissionStatus(permission.state);
      }
      startWatching();
    } catch {
      startWatching();
    }
  }, [startWatching]);

  useEffect(() => {
    requestPermission();
    return () => stopWatching();
  }, []);

  return { location, error, loading, permissionStatus, requestPermission, stopWatching };
};
