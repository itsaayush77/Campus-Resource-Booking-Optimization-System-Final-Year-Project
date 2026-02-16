const Booking = require('../models/Bookings');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

const SUSPENSION_DAYS = 7;
const NO_SHOW_THRESHOLD = 3;

const getSuspendedUntil = (fromDate = new Date()) => {
  const suspendedUntil = new Date(fromDate);
  suspendedUntil.setDate(suspendedUntil.getDate() + SUSPENSION_DAYS);
  return suspendedUntil;
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
      message: 'You missed your approved booking. Your no-show count has been updated.',
      relatedBooking
    });
  } catch (notificationError) {
    console.error('Failed to create no-show notification:', notificationError.message);
  }

  if (user.noShowCount >= NO_SHOW_THRESHOLD) {
    user.isSuspended = true;
    user.suspendedUntil = getSuspendedUntil(new Date());
    await user.save();

    try {
      await createNotification({
        userId: user._id,
        type: 'account_suspended',
        title: 'Account Suspended',
        message: `Your account is suspended until ${user.suspendedUntil.toISOString()} due to repeated no-shows.`,
        relatedBooking
      });
    } catch (notificationError) {
      console.error('Failed to create auto-suspension notification:', notificationError.message);
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
  markBookingAsNoShow
};
