const cron = require('node-cron');
const Booking = require('../models/Bookings');
const { markBookingAsNoShow } = require('../services/noShowService');
const { completeExpiredCheckedInBookings } = require('../services/bookingLifecycleService');

let schedulerStarted = false;

const startNoShowScheduler = () => {
  if (schedulerStarted) {
    return;
  }

  cron.schedule('*/5 * * * *', async () => {
    try {
      await completeExpiredCheckedInBookings();

      const threshold = new Date(Date.now() - 15 * 60 * 1000);
      const overdueBookings = await Booking.find({
        status: 'approved',
        checkInTime: null,
        startTime: { $lte: threshold }
      }).select('_id');

      for (const booking of overdueBookings) {
        await markBookingAsNoShow(booking._id);
      }
    } catch (error) {
      console.error('No-show scheduler failed:', error.message);
    }
  });

  schedulerStarted = true;
};

module.exports = {
  startNoShowScheduler
};
