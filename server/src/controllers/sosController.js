const SOS = require('../models/SOS');
const User = require('../models/User');
const logger = require('../utils/logger');

// @route POST /api/sos/trigger
const triggerSOS = async (req, res) => {
  try {
    const { lat, lng, message, triggerType = 'manual', address } = req.body;

    const user = await User.findById(req.user._id);

    // Create SOS record
    const sos = await SOS.create({
      userId: req.user._id,
      triggerType,
      location: { lat, lng, address },
      message: message || 'SOS! I need immediate help!',
      status: 'active',
      notifiedContacts: []
    });

    // Notify trusted contacts via Socket.io
    const io = req.app.get('io');

    const notifiedContacts = [];

    for (const contact of user.trustedContacts) {
      if (contact.notifyOnSOS) {
        // Emit to contact's socket room
        io?.to(`user_contact_${contact.phone}`).emit('sos:alert', {
          from: {
            id: user._id,
            name: user.name,
            phone: user.phone
          },
          location: { lat, lng, address },
          message: sos.message,
          timestamp: sos.createdAt,
          sosId: sos._id
        });

        notifiedContacts.push({
          contactId: contact._id,
          name: contact.name,
          phone: contact.phone,
          smsSent: false,  // Will be handled by SMS service
          pushSent: true,
          sentAt: new Date()
        });

        logger.info(`SOS notification sent to contact: ${contact.name}`);
      }
    }

    // Update SOS with notification records
    sos.notifiedContacts = notifiedContacts;
    await sos.save();

    // TODO: Trigger Twilio SMS (smsService)
    // TODO: Trigger Firebase FCM (pushService)

    // Broadcast to admin room
    io?.to('admin_room').emit('sos:new', {
      userId: user._id,
      userName: user.name,
      location: { lat, lng },
      sosId: sos._id
    });

    logger.warn(`🚨 SOS triggered by user: ${user.email} at [${lat}, ${lng}]`);

    return res.status(200).json({
      success: true,
      message: 'SOS alert sent to your trusted contacts!',
      data: {
        sosId: sos._id,
        notifiedCount: notifiedContacts.length,
        timestamp: sos.createdAt
      }
    });

  } catch (error) {
    logger.error(`SOS trigger error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to trigger SOS' });
  }
};

// @route POST /api/sos/cancel
const cancelSOS = async (req, res) => {
  try {
    const { sosId } = req.body;

    const sos = await SOS.findOneAndUpdate(
      { _id: sosId, userId: req.user._id, status: 'active' },
      { status: 'false_alarm', resolvedAt: new Date(), resolvedBy: 'user' },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ success: false, message: 'Active SOS not found' });
    }

    // Notify contacts it was cancelled
    const io = req.app.get('io');
    io?.to(`sos_room_${sosId}`).emit('sos:cancelled', {
      sosId,
      cancelledBy: req.user.name,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'SOS cancelled — contacts notified',
      data: { sosId: sos._id }
    });

  } catch (error) {
    logger.error(`Cancel SOS error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to cancel SOS' });
  }
};

// @route GET /api/sos/history
const getSOSHistory = async (req, res) => {
  try {
    const history = await SOS.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: { history, count: history.length }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get SOS history' });
  }
};

module.exports = { triggerSOS, cancelSOS, getSOSHistory };
