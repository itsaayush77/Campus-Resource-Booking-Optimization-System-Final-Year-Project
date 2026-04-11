const express = require('express');
const router = express.Router();

const {
  getStaffPendingBookings,
  approveStaffBooking,
  rejectStaffBooking,
  getStaffAnalytics
} = require('../controllers/staffController');
const { getStaffDepartmentResources } = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All staff routes require staff or admin role
// and staff must have booking assigned to their resources

router.get('/bookings/pending', protect, authorize('staff', 'admin'), getStaffPendingBookings);
router.patch('/bookings/:id/approve', protect, authorize('staff', 'admin'), approveStaffBooking);
router.patch('/bookings/:id/reject', protect, authorize('staff', 'admin'), rejectStaffBooking);

router.get('/analytics', protect, authorize('staff', 'admin'), getStaffAnalytics);
router.get('/resources', protect, authorize('staff', 'admin'), getStaffDepartmentResources);

module.exports = router;
