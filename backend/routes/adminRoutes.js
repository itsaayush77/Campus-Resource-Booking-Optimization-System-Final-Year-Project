const express = require('express');
const router = express.Router();

const {
  getAdminBookings,
  approveBooking,
  rejectBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/bookings', protect, authorize('admin'), getAdminBookings);
router.patch('/bookings/:id/approve', protect, authorize('admin'), approveBooking);
router.patch('/bookings/:id/reject', protect, authorize('admin'), rejectBooking);

module.exports = router;
