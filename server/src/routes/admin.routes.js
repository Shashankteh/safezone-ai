const express = require('express');
const router = express.Router();
const {
  getAnalytics, getUsers, getUserDetail, toggleUserStatus,
  promoteUser, verifyIncident, deleteIncident, getActiveSOSEvents, getSystemHealth
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/health', getSystemHealth);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/promote', promoteUser);
router.put('/incident/:id/verify', verifyIncident);
router.delete('/incident/:id', deleteIncident);
router.get('/sos/active', getActiveSOSEvents);

module.exports = router;