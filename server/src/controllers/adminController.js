const User = require('../models/User');
const Incident = require('../models/Incident');
const SOS = require('../models/SOS');
const Location = require('../models/Location');
const SafetyScore = require('../models/SafetyScore');
const logger = require('../utils/logger');

// @desc  Admin dashboard overview
// @route GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersLast7d,
      activeUsersLast30d,
      totalIncidents,
      incidentsToday,
      incidentsLast7d,
      totalSOS,
      sosToday,
      activeSOS,
      incidentsByType,
      incidentsBySeverity,
      sosLastWeek,
      incidentsLastWeek
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: last7d } }),
      User.countDocuments({ lastLogin: { $gte: last30d } }),
      Incident.countDocuments(),
      Incident.countDocuments({ timestamp: { $gte: today } }),
      Incident.countDocuments({ timestamp: { $gte: last7d } }),
      SOS.countDocuments(),
      SOS.countDocuments({ createdAt: { $gte: today } }),
      SOS.countDocuments({ status: 'active' }),
      Incident.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      // SOS per day last 7 days
      SOS.aggregate([
        { $match: { createdAt: { $gte: last7d } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Incidents per day last 7 days
      Incident.aggregate([
        { $match: { timestamp: { $gte: last7d } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, today: newUsersToday, last7d: newUsersLast7d, active30d: activeUsersLast30d },
        incidents: {
          total: totalIncidents,
          today: incidentsToday,
          last7d: incidentsLast7d,
          byType: incidentsByType,
          bySeverity: incidentsBySeverity
        },
        sos: { total: totalSOS, today: sosToday, active: activeSOS },
        charts: {
          sosLast7d: sosLastWeek,
          incidentsLast7d: incidentsLastWeek
        },
        generatedAt: new Date()
      }
    });
  } catch (err) {
    logger.error(`Admin analytics error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
};

// @desc  Get all users (paginated)
// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -refreshTokens -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

// @desc  Get single user detail
// @route GET /api/admin/users/:id
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -passwordResetToken');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [sosCount, incidentCount, recentSOS] = await Promise.all([
      SOS.countDocuments({ userId: user._id }),
      Incident.countDocuments({ reportedBy: user._id }),
      SOS.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    return res.status(200).json({
      success: true,
      data: { user, stats: { sosCount, incidentCount }, recentSOS }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin' });

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`Admin ${req.user.email} toggled user ${user.email}: isActive=${user.isActive}`);

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { isActive: user.isActive }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle user status' });
  }
};

// @desc  Promote user to admin
// @route PUT /api/admin/users/:id/promote
const promoteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`User ${user.email} promoted to admin by ${req.user.email}`);

    return res.status(200).json({ success: true, message: 'User promoted to admin', data: { user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to promote user' });
  }
};

// @desc  Verify an incident
// @route PUT /api/admin/incident/:id/verify
const verifyIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { verified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );

    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

    logger.info(`Incident ${incident._id} verified by admin ${req.user.email}`);

    return res.status(200).json({ success: true, data: { incident } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify incident' });
  }
};

// @desc  Delete incident
// @route DELETE /api/admin/incident/:id
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

    logger.info(`Incident ${incident._id} deleted by admin ${req.user.email}`);

    return res.status(200).json({ success: true, message: 'Incident deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete incident' });
  }
};

// @desc  Get active SOS events
// @route GET /api/admin/sos/active
const getActiveSOSEvents = async (req, res) => {
  try {
    const activeEvents = await SOS.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    return res.status(200).json({
      success: true,
      data: { events: activeEvents, count: activeEvents.length }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get active SOS' });
  }
};

// @desc  System health check
// @route GET /api/admin/health
const getSystemHealth = async (req, res) => {
  try {
    const [userCount, incidentCount, activeSOS] = await Promise.all([
      User.countDocuments(),
      Incident.countDocuments(),
      SOS.countDocuments({ status: 'active' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        database: 'connected',
        collections: { users: userCount, incidents: incidentCount, activeSOS },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'System health check failed' });
  }
};

module.exports = {
  getAnalytics, getUsers, getUserDetail, toggleUserStatus,
  promoteUser, verifyIncident, deleteIncident, getActiveSOSEvents, getSystemHealth
};
