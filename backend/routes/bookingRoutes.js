const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getMyBookingHistory,
  getBookingById,
  cancelBooking,
  checkInBooking,
  checkOutBooking
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/my/history', protect, getMyBookingHistory);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);
router.post('/:id/check-in', protect, checkInBooking);
router.post('/:id/check-out', protect, checkOutBooking);

module.exports = router;
