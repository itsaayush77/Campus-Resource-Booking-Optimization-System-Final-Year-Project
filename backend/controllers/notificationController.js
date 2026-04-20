const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('relatedBooking', 'resourceId startTime endTime status')
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// @desc    Mark one notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount: await Notification.countDocuments({ userId: req.user._id, isRead: false }),
      notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// @desc    Mark multiple notifications as read
// @route   PATCH /api/notifications/read-many
// @access  Private
exports.markManyNotificationsAsRead = async (req, res) => {
  try {
    const notificationIds = Array.isArray(req.body?.notificationIds)
      ? req.body.notificationIds
      : [];

    if (notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be a non-empty array'
      });
    }

    const validObjectIds = notificationIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid notification IDs provided'
      });
    }

    const now = new Date();
    const updateResult = await Notification.updateMany(
      {
        _id: { $in: validObjectIds },
        userId: req.user._id,
        isRead: false,
      },
      { $set: { isRead: true, readAt: now } }
    );

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Selected notifications marked as read',
      updatedCount: updateResult.modifiedCount || 0,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const now = new Date();
    const updateResult = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: updateResult.modifiedCount || 0,
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message
    });
  }
};
