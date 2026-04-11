const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Booking = require('../models/Bookings');
const Resource = require('../models/Resource');
const User = require('../models/User');
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

// @desc    Get pending bookings for staff's assigned resources
// @route   GET /api/staff/bookings/pending
// @access  Private/Staff
exports.getStaffPendingBookings = async (req, res) => {
  try {
    let filter = { status: 'pending' };

    // If staff (not admin), filter by assigned resources
    if (req.user.role === 'staff') {
      const user = await User.findById(req.user._id).select('assignedResources');
      if (!user || !user.assignedResources.length) {
        return res.status(200).json({
          success: true,
          message: 'No bookings to approve - no resources assigned',
          bookings: []
        });
      }
      filter.resourceId = { $in: user.assignedResources };
    }
    // else: admin can see all pending bookings

    const bookings = await Booking.find(filter)
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

// @desc    Approve a booking (staff can only approve for assigned resources)
// @route   PATCH /api/staff/bookings/:id/approve
// @access  Private/Staff
exports.approveStaffBooking = async (req, res) => {
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

    // Verify staff is assigned to this resource
    if (req.user.role === 'staff') {
      const user = await User.findById(req.user._id).select('assignedResources');
      const isAssigned = user.assignedResources.some(
        (resourceId) => resourceId.toString() === booking.resourceId.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to approve bookings for this resource',
          errorCode: 'NOT_ASSIGNED_RESOURCE'
        });
      }
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

    // Generate QR token with format: bookingId|randomToken
    const qrToken = crypto.randomBytes(12).toString('hex');
    const qrData = `${booking._id.toString()}|${qrToken}`;
    booking.qrCode = qrData;

    try {
      booking.qrCodeImage = await QRCode.toDataURL(qrData, {
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
        message: `Your booking for ${resource.name} has been approved by ${req.user.name || 'staff'}.`,
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create approval notification:', notificationError.message);
    }

    // Populate full details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phoneNumber')
      .populate('resourceId', 'name location capacity type');

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      booking: populatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
      error: error.message
    });
  }
};

// @desc    Reject a booking (staff can only reject for assigned resources)
// @route   PATCH /api/staff/bookings/:id/reject
// @access  Private/Staff
exports.rejectStaffBooking = async (req, res) => {
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

    // Verify staff is assigned to this resource
    if (req.user.role === 'staff') {
      const user = await User.findById(req.user._id).select('assignedResources');
      const isAssigned = user.assignedResources.some(
        (resourceId) => resourceId.toString() === booking.resourceId.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to reject bookings for this resource',
          errorCode: 'NOT_ASSIGNED_RESOURCE'
        });
      }
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending bookings can be rejected. Current status: ${booking.status}`
      });
    }

    const resource = await Resource.findById(booking.resourceId);

    booking.status = 'rejected';
    booking.rejectionReason = reason || `Rejected by ${req.user.name || 'staff'}`;
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
        message: `Your booking for ${resource.name} was rejected. Reason: ${booking.rejectionReason}`,
        relatedBooking: booking._id
      });
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError.message);
    }

    // Populate full details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phoneNumber')
      .populate('resourceId', 'name location capacity type');

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      booking: populatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

// @desc    Get analytics for staff's assigned resources only
// @route   GET /api/staff/analytics
// @access  Private/Staff
exports.getStaffAnalytics = async (req, res) => {
  try {
    let resourceFilter = {};

    // If staff (not admin), filter by assigned resources
    if (req.user.role === 'staff') {
      const user = await User.findById(req.user._id).select('assignedResources');
      if (!user || !user.assignedResources.length) {
        return res.status(200).json({
          success: true,
          message: 'No analytics available - no resources assigned',
          analytics: {
            totalBookings: 0,
            approvedBookings: 0,
            pendingBookings: 0,
            rejectedBookings: 0,
            completedBookings: 0,
            noShowBookings: 0,
            utilizationRate: 0
          }
        });
      }
      resourceFilter = { _id: { $in: user.assignedResources } };
    }

    // Get assigned resources
    const resources = await Resource.find(resourceFilter).lean();
    const resourceIds = resources.map((r) => r._id);

    if (resourceIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No resources assigned',
        analytics: {
          totalBookings: 0,
          approvedBookings: 0,
          pendingBookings: 0,
          rejectedBookings: 0,
          completedBookings: 0,
          noShowBookings: 0,
          utilizationRate: 0,
          totalBudgetBooked: 0
        }
      });
    }

    // Fetch all bookings for assigned resources
    const allBookings = await Booking.find({
      resourceId: { $in: resourceIds }
    }).lean();

    // Calculate metrics
    const totalBookings = allBookings.length;
    const approvedBookings = allBookings.filter((b) => b.status === 'approved').length;
    const pendingBookings = allBookings.filter((b) => b.status === 'pending').length;
    const rejectedBookings = allBookings.filter((b) => b.status === 'rejected').length;
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;
    const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
    const noShowBookings = allBookings.filter((b) => b.status === 'no_show').length;

    const utilizationRate =
      totalBookings > 0
        ? (
            ((approvedBookings + completedBookings) / totalBookings) *
            100
          ).toFixed(2)
        : 0;

    return res.status(200).json({
      success: true,
      message: 'Staff analytics retrieved successfully',
      analytics: {
        assignedResourceCount: resourceIds.length,
        totalBookings,
        approvedBookings,
        pendingBookings,
        rejectedBookings,
        cancelledBookings,
        completedBookings,
        noShowBookings,
        utilizationRate: parseFloat(utilizationRate),
        resourceDetails: resources.map((r) => ({
          id: r._id,
          name: r.name,
          category: r.category,
          bookingCount: allBookings.filter((b) => b.resourceId.toString() === r._id.toString()).length
        }))
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
