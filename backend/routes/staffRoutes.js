const express = require('express');
const router = express.Router();

const {
  getStaffReviewBookings,
  getStaffPendingBookings,
  getStaffAnalytics,
  saveStaffBookingReview
} = require('../controllers/staffController');
const { getStaffDepartmentResources } = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All staff routes require staff or admin role
// Staff can VIEW pending bookings and analytics, but only ADMIN can approve/reject

router.get('/bookings/review', protect, authorize('staff', 'admin'), getStaffReviewBookings);
router.get('/bookings/pending', protect, authorize('staff', 'admin'), getStaffPendingBookings);
router.patch('/bookings/:id/review', protect, authorize('staff', 'admin'), saveStaffBookingReview);
router.get('/analytics', protect, authorize('staff', 'admin'), getStaffAnalytics);
router.get('/resources', protect, authorize('staff', 'admin'), getStaffDepartmentResources);

module.exports = router;
