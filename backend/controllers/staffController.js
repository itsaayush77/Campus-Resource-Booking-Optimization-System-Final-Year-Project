const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Booking = require('../models/Bookings');
const Resource = require('../models/Resource');
const { createNotification } = require('../services/notificationService');

const getNoShowThreshold = (date) => new Date(new Date(date).getTime() + 15 * 60 * 1000);

const hasConflict = async (resourceId, startTime, endTime, ignoreBookingId = null) => {
  const query = {
    resourceId,
    status: { $in: ['pending', 'approved'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (ignoreBookingId) {
    query._id = { $ne: ignoreBookingId };
  }

  const existing = await Booking.findOne(query).lean();
  return Boolean(existing);
};

// @desc    Get all pending bookings (staff can approve any)
// @route   GET /api/staff/bookings/pending
// @access  Private/Staff
exports.getStaffPendingBookings = async (req, res) => {
  try {
    // Staff can see ALL pending bookings (no resource restriction)
    const bookings = await Booking.find({ status: 'pending' })
      .populate('userId', 'name email phoneNumber department')
      .populate('resourceId', 'name location capacity type category')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Found ${bookings.length} pending booking(s)`,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings',
      error: error.message
    });
  }
};

// @desc    Approve a booking - ADMIN ONLY
// @route   PATCH /api/staff/bookings/:id/approve
// @access  Private/Admin
// NOTE: Only admins should call this endpoint. Staff can view but not approve.
exports.approveStaffBooking = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Only administrators can approve bookings. Staff members can view pending bookings only.'
  });
};

// @desc    Reject a booking - ADMIN ONLY
// @route   PATCH /api/staff/bookings/:id/reject
// @access  Private/Admin
// NOTE: Only admins should call this endpoint. Staff can view but not reject.
exports.rejectStaffBooking = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Only administrators can reject bookings. Staff members can view pending bookings only.'
  });
};

// @desc    Get staff analytics (simplified - all bookings they can see)
// @route   GET /api/staff/analytics
// @access  Private/Staff
exports.getStaffAnalytics = async (req, res) => {
  try {
    // Staff gets analytics for all bookings (same as admin but simpler view)
    const allBookings = await Booking.find().lean();

    const totalBookings = allBookings.length;
    const approvedBookings = allBookings.filter((b) => b.status === 'approved').length;
    const pendingBookings = allBookings.filter((b) => b.status === 'pending').length;
    const rejectedBookings = allBookings.filter((b) => b.status === 'rejected').length;
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;
    const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
    const noShowBookings = allBookings.filter((b) => b.status === 'no_show').length;

    const utilizationRate =
      totalBookings > 0
        ? (((approvedBookings + completedBookings) / totalBookings) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      success: true,
      message: 'Staff analytics retrieved successfully',
      analytics: {
        totalBookings,
        approvedBookings,
        pendingBookings,
        rejectedBookings,
        cancelledBookings,
        completedBookings,
        noShowBookings,
        utilizationRate: parseFloat(utilizationRate)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staff analytics',
      error: error.message
    });
  }
};
