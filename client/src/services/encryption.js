import CryptoJS from 'crypto-js';

const KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'safezone-default-key-change-in-production';

// ── Encrypt location coordinates before sending to server ────────────────────
export const encryptCoordinates = (lat, lng) => {
  try {
    const data = JSON.stringify({ lat, lng, ts: Date.now() });
    const encrypted = CryptoJS.AES.encrypt(data, KEY).toString();
    return { encrypted, success: true };
  } catch {
    return { encrypted: null, success: false };
  }
};

// ── Decrypt coordinates received from server ──────────────────────────────────
export const decryptCoordinates = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return { ...JSON.parse(decrypted), success: true };
  } catch {
    return { lat: null, lng: null, success: false };
  }
};

// ── Hash sensitive data (one-way) ─────────────────────────────────────────────
export const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

// ── Encrypt arbitrary object ──────────────────────────────────────────────────
export const encryptObject = (obj) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(obj), KEY).toString();
  } catch {
    return null;
  }
};

// ── Decrypt to object ─────────────────────────────────────────────────────────
export const decryptObject = (encrypted) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
};
