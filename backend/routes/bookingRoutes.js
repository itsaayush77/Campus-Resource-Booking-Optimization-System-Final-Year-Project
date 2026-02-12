const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getMyBookingHistory,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/my/history', protect, getMyBookingHistory);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
