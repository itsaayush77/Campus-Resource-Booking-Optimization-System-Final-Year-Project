const express = require('express');
const router = express.Router();

const {
  getAdminBookings,
  approveBooking,
  rejectBooking,
  markNoShow
} = require('../controllers/bookingController');
const {
  getAllUsers,
  toggleUserActiveStatus,
  suspendUser,
  unsuspendUser
} = require('../controllers/userController');
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/bookings', protect, authorize('admin'), getAdminBookings);
router.patch('/bookings/:id/approve', protect, authorize('admin'), approveBooking);
router.patch('/bookings/:id/reject', protect, authorize('admin'), rejectBooking);
router.patch('/bookings/:id/mark-no-show', protect, authorize('admin'), markNoShow);

router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:id/toggle-active', protect, authorize('admin'), toggleUserActiveStatus);
router.patch('/users/:id/suspend', protect, authorize('admin'), suspendUser);
router.patch('/users/:id/unsuspend', protect, authorize('admin'), unsuspendUser);

router.get('/analytics/summary', protect, authorize('admin'), getAnalyticsSummary);

module.exports = router;
