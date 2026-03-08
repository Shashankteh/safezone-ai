const CryptoJS = require('crypto-js');
const logger = require('./logger');

const SECRET_KEY = process.env.ENCRYPTION_KEY;

// Encrypt location coordinates
const encryptCoordinates = (lat, lng) => {
  try {
    const data = JSON.stringify({ lat, lng });
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    throw new Error('Failed to encrypt location data');
  }
};

// Decrypt location coordinates
const decryptCoordinates = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    throw new Error('Failed to decrypt location data');
  }
};

// Encrypt any string data
const encryptData = (data) => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
};

// Decrypt any string data
const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Hash sensitive data (one-way)
const hashData = (data) => {
  return CryptoJS.SHA256(data + SECRET_KEY).toString();
};

module.exports = {
  encryptCoordinates,
  decryptCoordinates,
  encryptData,
  decryptData,
  hashData
};
