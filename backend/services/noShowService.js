const Booking = require('../models/Bookings');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

const SUSPENSION_DAYS = 3;  // 3-day suspension
const NO_SHOW_THRESHOLD = 2; // 2 no-shows trigger suspension

const getSuspendedUntil = (fromDate = new Date()) => {
  const suspendedUntil = new Date(fromDate);
  suspendedUntil.setDate(suspendedUntil.getDate() + SUSPENSION_DAYS);
  return suspendedUntil;
};

// Cancel all future bookings within suspension period
const cancelFutureBookings = async (userId, suspendedUntil) => {
  const cancelledBookings = await Booking.updateMany(
    {
      userId,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lte: suspendedUntil }
    },
    {
      $set: {
        status: 'cancelled',
        cancellationReason: 'Cancelled due to account suspension for repeated no-shows'
      }
    }
  );

  return cancelledBookings;
};

const applyNoShowPenalty = async (userId, relatedBooking) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { noShowCount: 1 } },
    { new: true }
  );

  if (!user) {
    return null;
  }

  try {
    await createNotification({
      userId: user._id,
      type: 'no_show_warning',
      title: 'Booking Marked No-Show',
      message: `You missed your approved booking. No-show count: ${user.noShowCount}/${NO_SHOW_THRESHOLD}`,
      relatedBooking
    });
  } catch (notificationError) {
    console.error('Failed to create no-show notification:', notificationError.message);
  }

  // Trigger suspension when reaching threshold
  if (user.noShowCount >= NO_SHOW_THRESHOLD) {
    const suspendedUntil = getSuspendedUntil(new Date());
    user.isSuspended = true;
    user.suspendedUntil = suspendedUntil;
    await user.save();

    // Cancel all future bookings during suspension period
    await cancelFutureBookings(userId, suspendedUntil);

    try {
      await createNotification({
        userId: user._id,
        type: 'account_suspended',
        title: 'Account Suspended',
        message: `Your account has been suspended until ${suspendedUntil.toLocaleDateString()} due to ${user.noShowCount} no-shows. All future bookings have been cancelled.`,
        relatedBooking
      });
    } catch (notificationError) {
      console.error('Failed to create suspension notification:', notificationError.message);
    }
  }

  return user;
};

const markBookingAsNoShow = async (bookingId) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'approved', checkInTime: null },
    { $set: { status: 'no_show' } },
    { new: true }
  );

  if (!booking) {
    return { updated: false };
  }

  const user = await applyNoShowPenalty(booking.userId, booking._id);
  return { updated: true, booking, user };
};

module.exports = {
  applyNoShowPenalty,
  markBookingAsNoShow,
  cancelFutureBookings
};
