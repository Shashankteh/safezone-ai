const express = require('express');
const router = express.Router();
const { triggerSOS, cancelSOS, getSOSHistory } = require('../controllers/sosController');
const { protect } = require('../middleware/auth.middleware');
const { sosLimiter } = require('../middleware/rateLimit.middleware');

router.post('/trigger', protect, sosLimiter, triggerSOS);
router.post('/cancel', protect, cancelSOS);
router.get('/history', protect, getSOSHistory);

module.exports = router;
