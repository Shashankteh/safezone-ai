const cron = require('node-cron');
const User = require('../models/User');
const SOS = require('../models/SOS');
const { sendDeadMansSwitchAlert } = require('./smsService');
const { sendCheckInReminder } = require('./pushService');
const logger = require('../utils/logger');

let io = null;

const initDeadMansSwitch = (socketIo) => {
  io = socketIo;

  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkDeadMansSwitches();
  });

  // Send reminders 5 minutes before deadline
  cron.schedule('* * * * *', async () => {
    await sendCheckInReminders();
  });

  logger.info('💀 Dead Man\'s Switch cron initialized');
};

const checkDeadMansSwitches = async () => {
  try {
    const now = new Date();

    // Find users with active check-in who have missed their deadline
    const overdueUsers = await User.find({
      checkInActive: true,
      checkInInterval: { $ne: null },
      lastCheckIn: { $ne: null }
    });

    for (const user of overdueUsers) {
      const deadline = new Date(user.lastCheckIn.getTime() + user.checkInInterval * 60 * 1000);

      if (now > deadline) {
        logger.warn(`💀 Dead Man's Switch triggered for user: ${user.email}`);

        // Create auto SOS
        const sos = await SOS.create({
          userId: user._id,
          triggerType: 'dead_mans_switch',
          location: { lat: null, lng: null, address: 'Last known location unavailable' },
          message: `AUTO SOS: ${user.name} missed their ${user.checkInInterval}-minute safety check-in!`,
          status: 'active',
          notifiedContacts: []
        });

        // Notify trusted contacts
        for (const contact of user.trustedContacts || []) {
          if (!contact.notifyOnSOS) continue;

          // SMS
          await sendDeadMansSwitchAlert({
            toPhone: contact.phone,
            userName: user.name,
            lastSeen: user.lastCheckIn
          });

          // Socket
          io?.to(`user_contact_${contact.phone}`).emit('sos:alert', {
            from: { id: user._id, name: user.name, phone: user.phone },
            location: null,
            message: sos.message,
            timestamp: sos.createdAt,
            sosId: sos._id,
            type: 'dead_mans_switch'
          });
        }

        // Disable the switch to prevent repeat alerts
        await User.findByIdAndUpdate(user._id, {
          checkInActive: false
        });

        io?.to('admin_room').emit('sos:new', {
          userId: user._id,
          userName: user.name,
          triggerType: 'dead_mans_switch',
          sosId: sos._id
        });
      }
    }
  } catch (err) {
    logger.error(`Dead Man's Switch check error: ${err.message}`);
  }
};

const sendCheckInReminders = async () => {
  try {
    const now = new Date();
    const REMINDER_BEFORE = 5; // minutes

    const users = await User.find({
      checkInActive: true,
      checkInInterval: { $ne: null },
      lastCheckIn: { $ne: null },
      pushToken: { $ne: null }
    });

    for (const user of users) {
      const deadline = new Date(user.lastCheckIn.getTime() + user.checkInInterval * 60 * 1000);
      const minutesLeft = Math.floor((deadline - now) / (1000 * 60));

      if (minutesLeft === REMINDER_BEFORE) {
        await sendCheckInReminder({
          pushToken: user.pushToken,
          userName: user.name,
          minutesLeft: REMINDER_BEFORE
        });

        io?.to(`user_${user._id}`).emit('checkin:reminder', {
          minutesLeft: REMINDER_BEFORE,
          deadline: deadline.toISOString()
        });
      }
    }
  } catch (err) {
    logger.error(`Reminder check error: ${err.message}`);
  }
};

module.exports = { initDeadMansSwitch };
