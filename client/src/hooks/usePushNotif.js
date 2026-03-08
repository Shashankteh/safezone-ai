import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};

export const usePushNotif = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkExistingSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {}
  }, []);

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestPermission();
      if (!granted) {
        setLoading(false);
        return { success: false, reason: 'Permission denied' };
      }

      if (!('serviceWorker' in navigator)) {
        setLoading(false);
        return { success: false, reason: 'Service Worker not supported' };
      }

      const registration = await navigator.serviceWorker.ready;

      // Unsubscribe existing
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      // Create new subscription
      const subscribeOptions = { userVisibleOnly: true };
      if (VAPID_PUBLIC_KEY) {
        subscribeOptions.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      }

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Send to backend (store FCM token)
      await api.post('/api/auth/push-token', { subscription: subscription.toJSON() });

      setIsSubscribed(true);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch {}
  }, []);

  const showLocalNotification = useCallback((title, body, options = {}) => {
    if (permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/badge.png',
      ...options
    });
  }, [permission]);

  return { permission, isSubscribed, loading, subscribe, unsubscribe, requestPermission, showLocalNotification };
};
