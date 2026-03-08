const logger = require('../utils/logger');

// ── Firebase Admin (lazy init) ────────────────────────────────────────────────
let firebaseAdmin = null;

const getFirebaseAdmin = () => {
  if (firebaseAdmin) return firebaseAdmin;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    logger.warn('⚠️  Firebase not configured — push notifications disabled');
    return null;
  }
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
    }
    firebaseAdmin = admin;
    logger.info('✅ Firebase Admin initialized');
    return firebaseAdmin;
  } catch (err) {
    logger.error(`Firebase init failed: ${err.message}`);
    return null;
  }
};

// ── SOS Push Notification ─────────────────────────────────────────────────────
const sendSOSPush = async ({ pushToken, fromName, lat, lng, message, sosId }) => {
  const admin = getFirebaseAdmin();
  if (!admin || !pushToken) return { success: false, reason: 'Firebase/token not available' };

  try {
    const result = await admin.messaging().send({
      token: pushToken,
      notification: {
        title: `🚨 SOS from ${fromName}`,
        body: message || `${fromName} needs immediate help!`
      },
      data: {
        type: 'sos_alert',
        sosId: sosId?.toString() || '',
        fromName,
        lat: String(lat),
        lng: String(lng),
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'sos_alarm',
          channelId: 'sos_channel',
          priority: 'max',
          visibility: 'public'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'sos_alarm.wav',
            badge: 1,
            'content-available': 1,
            'interruption-level': 'critical'
          }
        }
      }
    });

    logger.warn(`SOS push sent — Message ID: ${result}`);
    return { success: true, messageId: result };
  } catch (err) {
    logger.error(`SOS push failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Geofence Push Notification ────────────────────────────────────────────────
const sendGeofencePush = async ({ pushToken, userName, zoneName, breachType }) => {
  const admin = getFirebaseAdmin();
  if (!admin || !pushToken) return { success: false };

  try {
    const action = breachType === 'enter' ? 'entered' : 'exited';
    const emoji = breachType === 'enter' ? '⚠️' : '✅';

    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: `${emoji} Geofence Alert`,
        body: `${userName} has ${action} "${zoneName}"`
      },
      data: { type: 'geofence_breach', zoneName, breachType }
    });

    return { success: true };
  } catch (err) {
    logger.error(`Geofence push failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Nearby Incident Push Notification ────────────────────────────────────────
const sendIncidentPush = async ({ pushToken, incidentType, distance, severity }) => {
  const admin = getFirebaseAdmin();
  if (!admin || !pushToken) return { success: false };

  try {
    const severityEmoji = { 1: '⚠️', 2: '🟠', 3: '🔴' }[severity] || '⚠️';

    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: `${severityEmoji} Nearby Incident`,
        body: `A ${incidentType} was reported ${distance}m from you. Stay alert!`
      },
      data: { type: 'nearby_incident', incidentType, distance: String(distance) }
    });

    return { success: true };
  } catch (err) {
    logger.error(`Incident push failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Dead Man's Switch Push ────────────────────────────────────────────────────
const sendCheckInReminder = async ({ pushToken, userName, minutesLeft }) => {
  const admin = getFirebaseAdmin();
  if (!admin || !pushToken) return { success: false };

  try {
    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: '⏰ SafeZone Check-In',
        body: `${minutesLeft} minutes left for your safety check-in. Tap to confirm you're safe.`
      },
      data: { type: 'checkin_reminder', minutesLeft: String(minutesLeft) }
    });

    return { success: true };
  } catch (err) {
    logger.error(`Check-in push failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Send to Multiple Tokens ───────────────────────────────────────────────────
const sendMulticast = async ({ tokens, title, body, data = {} }) => {
  const admin = getFirebaseAdmin();
  if (!admin || !tokens?.length) return { success: false };

  try {
    const result = await admin.messaging().sendEachForMulticast({
      tokens: tokens.filter(Boolean),
      notification: { title, body },
      data
    });

    logger.info(`Multicast: ${result.successCount} success, ${result.failureCount} failed`);
    return { success: true, successCount: result.successCount, failureCount: result.failureCount };
  } catch (err) {
    logger.error(`Multicast push failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendSOSPush,
  sendGeofencePush,
  sendIncidentPush,
  sendCheckInReminder,
  sendMulticast
};
