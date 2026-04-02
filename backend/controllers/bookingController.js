const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Booking = require('../models/Bookings');
const Resource = require('../models/Resource');
const { createNotification } = require('../services/notificationService');
const { markBookingAsNoShow } = require('../services/noShowService');

const ACTIVE_BOOKING_STATUSES = ['pending', 'approved'];
const isNextFunction = (next) => typeof next === 'function';

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const parseDateRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return { start, end, valid: isValidDate(start) && isValidDate(end) };
};

const getNoShowThreshold = (date) => new Date(new Date(date).getTime() + 15 * 60 * 1000);

const hasConflict = async (resourceId, startTime, endTime, ignoreBookingId = null) => {
  const query = {
    resourceId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (ignoreBookingId) {
    query._id = { $ne: ignoreBookingId };
  }

  const existing = await Booking.findOne(query).lean();
  return Boolean(existing);
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { resourceId, startTime, endTime, purpose, expectedAttendees, notes } = req.body || {};

    if (!resourceId || !startTime || !endTime || !purpose || !expectedAttendees) {
      return res.status(400).json({
        success: false,
        message: 'resourceId, startTime, endTime, purpose and expectedAttendees are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found or unavailable'
      });
    }

    const attendees = Number(expectedAttendees);
    if (!Number.isInteger(attendees) || attendees < 1) {
      return res.status(400).json({
        success: false,
        message: 'expectedAttendees must be a positive integer'
      });
    }

    if (attendees > resource.capacity) {
      return res.status(400).json({
        success: false,
        message: `Expected attendees exceed resource capacity (${resource.capacity})`
      });
    }

    const { start, end, valid } = parseDateRange(startTime, endTime);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime or endTime'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime'
      });
    }

    if (start <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'startTime must be in the future'
      });
    }

    const conflict = await hasConflict(resourceId, start, end);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Booking conflict: resource already booked for this time range'
      });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      resourceId,
      startTime: start,
      endTime: end,
      purpose,
      expectedAttendees: attendees,
      notes,
      status: 'pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('resourceId', 'name location capacity type category')
      .populate('userId', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Booking created and pending approval',
      booking: populatedBooking
    });
  } catch (error) {
    if (isNextFunction(next)) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// @desc    Get current user bookings
// @route   GET /api/bookings/my
// @access  Private 
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      status: { $nin: ['completed', 'cancelled', 'rejected', 'no_show'] }
    })
      .populate('resourceId', 'name location capacity type category')
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your bookings',
      error: error.message
    });
  }
};

// @desc    Get current user booking history
// @route   GET /api/bookings/my/history
// @access  Private
exports.getMyBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      status: { $in: ['completed', 'cancelled', 'rejected', 'no_show'] }
    })
      .populate('resourceId', 'name location capacity type category')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking history',
      error: error.message
    });
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id)
      .populate('resourceId', 'name location capacity type category description amenities availability isActive')
      .populate('userId', 'name email role department');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = booking.userId?._id?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to view this booking'
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own booking'
      });
    }

    if (!booking.canCancel()) {
      return res.status(400).json({
        success: false,
        message: `Booking with status '${booking.status}' cannot be cancelled`
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    try {
      await createNotification({
        userId: booking.userId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled.',
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create cancellation notification:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// @desc    List admin bookings by status
// @route   GET /api/admin/bookings?status=pending
// @access  Private/Admin
exports.getAdminBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email department')
      .populate('resourceId', 'name location capacity')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin bookings',
      error: error.message
    });
  }
};

// @desc    Approve booking
// @route   PATCH /api/admin/bookings/:id/approve
// @access  Private/Admin
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending bookings can be approved. Current status: ${booking.status}`
      });
    }

    const resource = await Resource.findById(booking.resourceId);
    if (!resource || !resource.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Resource is no longer available'
      });
    }

    const conflict = await hasConflict(
      booking.resourceId,
      booking.startTime,
      booking.endTime,
      booking._id
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Cannot approve booking due to a time conflict'
      });
    }

    if (new Date() >= getNoShowThreshold(booking.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve booking because the check-in grace window has already passed'
      });
    }

    booking.status = 'approved';
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    booking.rejectionReason = null;
    booking.qrCode = `BK-${booking._id.toString()}-${crypto.randomBytes(12).toString('hex')}`;

    try {
      booking.qrCodeImage = await QRCode.toDataURL(booking.qrCode, {
        margin: 1,
        width: 280
      });
    } catch (qrError) {
      console.error('Failed to generate QR image:', qrError.message);
      booking.qrCodeImage = null;
    }

    await booking.save();

    try {
      await createNotification({
        userId: booking.userId,
        type: 'booking_approved',
        title: 'Booking Approved',
        message: 'Your booking request has been approved.',
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create approval notification:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
      error: error.message
    });
  }
};

// @desc    Reject booking
// @route   PATCH /api/admin/bookings/:id/reject
// @access  Private/Admin
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending bookings can be rejected. Current status: ${booking.status}`
      });
    }

    booking.status = 'rejected';
    booking.rejectionReason = reason || 'Rejected by admin';
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    booking.qrCode = null;
    booking.qrCodeImage = null;
    await booking.save();

    try {
      await createNotification({
        userId: booking.userId,
        type: 'booking_rejected',
        title: 'Booking Rejected',
        message: booking.rejectionReason || 'Your booking request was rejected.',
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

// @desc    Check in to approved booking with QR token
// @route   POST /api/bookings/:id/check-in
// @access  Private
exports.checkInBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = booking.userId.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to check in for this booking'
      });
    }

    if (booking.checkInTime || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already checked in'
      });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Only approved bookings can be checked in. Current status: ${booking.status}`
      });
    }

    if (!token || token !== booking.qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in token'
      });
    }

    const now = new Date();
    const bookingStartTime = new Date(booking.startTime);
    const bookingEndTime = new Date(booking.endTime);
    const checkInOpenTime = new Date(bookingStartTime.getTime() - 15 * 60 * 1000);
    if (now < checkInOpenTime || now > bookingEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Check-in is only allowed from 15 minutes before start time until end time'
      });
    }

    booking.checkInTime = now;
    booking.status = 'completed';
    await booking.save();

    try {
      await createNotification({
        userId: booking.userId,
        type: 'booking_completed',
        title: 'Check-In Completed',
        message: 'You have successfully checked in and your booking is now marked as completed.',
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create completion notification:', notificationError.message);
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('resourceId', 'name location capacity type category')
      .populate('userId', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Check-in successful',
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check in booking',
      error: error.message
    });
  }
};

//   Mark approved booking as no-show
// @route   PATCH /api/admin/bookings/:id/mark-no-show
// @access  Private/Admin
exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Only approved bookings can be marked as no-show. Current status: ${booking.status}`
      });
    }

    if (booking.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Booking already has check-in time and cannot be marked as no-show'
      });
    }

    const result = await markBookingAsNoShow(booking._id);
    if (!result.updated) {
      return res.status(400).json({
        success: false,
        message: 'Booking could not be marked as no-show'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking marked as no-show',
      booking: result.booking,
      user: {
        id: result.user?._id,
        noShowCount: result.user?.noShowCount,
        isSuspended: result.user?.isSuspended,
        suspendedUntil: result.user?.suspendedUntil
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark booking as no-show',
      error: error.message
    });
  }
};
