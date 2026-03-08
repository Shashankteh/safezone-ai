const logger = require('../utils/logger');

// ── Twilio Client (lazy init so app works without Twilio keys) ────────────────
let twilioClient = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn('⚠️  Twilio not configured — SMS disabled');
    return null;
  }
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
};

// ── SOS SMS ───────────────────────────────────────────────────────────────────
const sendSOSAlert = async ({ toPhone, fromName, lat, lng, message, address }) => {
  const client = getTwilioClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const body = `🚨 SAFEZONE SOS ALERT!\n\n${fromName} needs immediate help!\n\n📍 Location: ${address || 'See map link'}\n🗺️ Map: ${mapsLink}\n\n💬 Message: "${message}"\n\nRespond ASAP or call emergency services!\n\n— SafeZone AI`;

    const result = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });

    logger.info(`SOS SMS sent to ${toPhone} — SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`SMS send failed to ${toPhone}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Geofence Breach SMS ───────────────────────────────────────────────────────
const sendGeofenceAlert = async ({ toPhone, userName, zoneName, breachType, lat, lng }) => {
  const client = getTwilioClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const action = breachType === 'enter' ? 'entered' : 'exited';
    const emoji = breachType === 'enter' ? '⚠️' : '✅';

    const body = `${emoji} SafeZone Alert\n\n${userName} has ${action} the zone: "${zoneName}"\n\n📍 Location: ${mapsLink}\n\n— SafeZone AI`;

    const result = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });

    logger.info(`Geofence SMS sent — SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`Geofence SMS failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Dead Man's Switch SMS ─────────────────────────────────────────────────────
const sendDeadMansSwitchAlert = async ({ toPhone, userName, lastSeen }) => {
  const client = getTwilioClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const body = `⚠️ SafeZone AUTO ALERT!\n\n${userName} missed their scheduled safety check-in!\n\nLast seen: ${new Date(lastSeen).toLocaleString()}\n\nPlease check on them immediately!\n\n🆘 If unreachable — call 112 (Emergency)\n\n— SafeZone AI Dead Man's Switch`;

    const result = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });

    logger.warn(`Dead Man's Switch SMS sent to ${toPhone} for user: ${userName}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`Dead Man's Switch SMS failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Verification OTP SMS ──────────────────────────────────────────────────────
const sendOTP = async ({ toPhone, otp }) => {
  const client = getTwilioClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const body = `Your SafeZone verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code.`;
    const result = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });

    return { success: true, sid: result.sid };
  } catch (err) {
    logger.error(`OTP SMS failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = { sendSOSAlert, sendGeofenceAlert, sendDeadMansSwitchAlert, sendOTP };
