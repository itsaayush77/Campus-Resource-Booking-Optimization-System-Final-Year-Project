const mongoose = require('mongoose');
const Booking = require('../models/Bookings');

const STAFF_VISIBLE_BOOKING_STATUSES = ['pending', 'approved', 'completed', 'rejected', 'cancelled', 'no_show'];

const baseStaffBookingPopulate = (query) =>
  query
    .populate('userId', 'name email phoneNumber department')
    .populate('resourceId', 'name location capacity type category')
    .populate('reviewedBy', 'name email role');

// @desc    Get staff-visible bookings for review and monitoring
// @route   GET /api/staff/bookings/review?status=all|pending|approved|completed
// @access  Private/Staff
exports.getStaffReviewBookings = async (req, res) => {
  try {
    const requestedStatus = String(req.query?.status || 'all').trim().toLowerCase();

    const statuses =
      requestedStatus === 'pending'
        ? ['pending']
        : requestedStatus === 'approved'
          ? ['approved']
          : requestedStatus === 'completed'
            ? ['completed']
          : STAFF_VISIBLE_BOOKING_STATUSES;

    const bookings = await baseStaffBookingPopulate(
      Booking.find({ status: { $in: statuses } })
    ).sort({ startTime: 1, createdAt: -1 });

    const counts = bookings.reduce(
      (accumulator, booking) => {
        if (booking.status === 'pending') accumulator.pending += 1;
        if (booking.status === 'approved') accumulator.approved += 1;
        if (booking.status === 'completed') accumulator.completed += 1;
        if (booking.status === 'rejected') accumulator.rejected += 1;
        accumulator.total += 1;
        return accumulator;
      },
      { pending: 0, approved: 0, completed: 0, rejected: 0, total: 0 }
    );

    return res.status(200).json({
      success: true,
      message: `Found ${counts.total} staff-visible booking(s)`,
      counts,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staff review bookings',
      error: error.message,
    });
  }
};

// @desc    Get all pending bookings for staff review queue
// @route   GET /api/staff/bookings/pending
// @access  Private/Staff
exports.getStaffPendingBookings = async (req, res) => {
  try {
    const bookings = await baseStaffBookingPopulate(
      Booking.find({ status: 'pending' })
    ).sort({ createdAt: -1 });

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

// @desc    Save staff recommendation note for a pending booking
// @route   PATCH /api/staff/bookings/:id/review
// @access  Private/Staff
exports.saveStaffBookingReview = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = String(req.body?.recommendation || 'no_recommendation')
      .trim()
      .toLowerCase();
    const comment = String(req.body?.comment || '').trim();

    const allowedRecommendations = ['no_recommendation', 'recommend_approve', 'recommend_reject'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    if (!allowedRecommendations.includes(recommendation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation value'
      });
    }

    if (comment.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be 300 characters or less'
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
        message: 'Staff review note can only be added to pending bookings'
      });
    }

    booking.staffRecommendation = recommendation;
    booking.staffComment = comment;
    booking.reviewedBy = req.user._id;
    booking.reviewedAt = new Date();
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phoneNumber department')
      .populate('resourceId', 'name location capacity type category')
      .populate('reviewedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Review note saved. Admin remains the final decision-maker.',
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save staff review note',
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
