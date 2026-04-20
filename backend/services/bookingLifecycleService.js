const Booking = require('../models/Bookings');

const MINUTE_IN_MS = 60 * 1000;

const calculateUsageDuration = (checkInTime, checkOutTime) => {
  const durationMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
  if (Number.isNaN(durationMs) || durationMs <= 0) {
    return 0;
  }

  return Math.round(durationMs / MINUTE_IN_MS);
};

const completeExpiredCheckedInBookings = async (extraFilter = {}) => {
  const now = new Date();

  const staleBookings = await Booking.find({
    status: 'approved',
    checkInTime: { $ne: null },
    checkOutTime: null,
    endTime: { $lte: now },
    ...extraFilter,
  });

  if (!staleBookings.length) {
    return { updatedCount: 0, bookings: [] };
  }

  for (const booking of staleBookings) {
    const fallbackCheckOutTime =
      booking.endTime && booking.endTime > booking.checkInTime ? booking.endTime : now;

    booking.checkOutTime = fallbackCheckOutTime;
    booking.actualUsageDuration = calculateUsageDuration(
      booking.checkInTime,
      booking.checkOutTime
    );
    booking.status = 'completed';
    await booking.save();
  }

  return { updatedCount: staleBookings.length, bookings: staleBookings };
};

module.exports = {
  completeExpiredCheckedInBookings,
};
