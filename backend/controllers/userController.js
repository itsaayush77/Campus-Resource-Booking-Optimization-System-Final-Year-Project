const mongoose = require('mongoose');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber,
  department: user.department,
  isActive: user.isActive,
  noShowCount: user.noShowCount,
  isSuspended: user.isSuspended,
  suspendedUntil: user.suspendedUntil,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(userResponse)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// @desc    Update user role (student <-> staff only)
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const normalizedRole = String(role || '').toLowerCase();
    if (!['student', 'staff'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either student or staff'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin role cannot be changed via this endpoint'
      });
    }

    if (user.role === normalizedRole) {
      return res.status(400).json({
        success: false,
        message: `User is already ${normalizedRole}`
      });
    }

    user.role = normalizedRole;
    await user.save();

    try {
      await createNotification({
        userId: user._id,
        type: 'role_updated',
        title: 'Role Updated',
        message: `Your account role has been updated to ${normalizedRole}.`
      });
    } catch (notificationError) {
      console.error('Failed to create role update notification:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${normalizedRole}`,
      user: userResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// @desc    Toggle active status
// @route   PATCH /api/admin/users/:id/toggle-active
// @access  Private/Admin
exports.toggleUserActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot toggle your own active status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: userResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
};

// @desc    Suspend user
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { days, suspendedUntil, reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }

    let suspensionEndDate = null;
    if (suspendedUntil) {
      const parsedDate = new Date(suspendedUntil);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'suspendedUntil must be a valid future date'
        });
      }
      suspensionEndDate = parsedDate;
    } else {
      const durationDays = Number(days);
      if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
        return res.status(400).json({
          success: false,
          message: 'Provide valid suspension duration (days must be between 1 and 365) or use { suspendedUntil }'
        });
      }
      suspensionEndDate = addDays(durationDays);
    }

    user.isSuspended = true;
    user.suspendedUntil = suspensionEndDate;
    await user.save();

    try {
      const reasonText = String(reason || '').trim();
      await createNotification({
        userId: user._id,
        type: 'account_suspended',
        title: 'Account Suspended',
        message: reasonText
          ? `Your account has been suspended until ${suspensionEndDate.toISOString()}. Reason: ${reasonText}`
          : `Your account has been suspended until ${suspensionEndDate.toISOString()}.`
      });
    } catch (notificationError) {
      console.error('Failed to create suspension notification:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user: userResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
};

// @desc    Remove user suspension
// @route   PATCH /api/admin/users/:id/unsuspend
// @access  Private/Admin
exports.unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isSuspended = false;
    user.suspendedUntil = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User unsuspended successfully',
      user: userResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message
    });
  }
};
