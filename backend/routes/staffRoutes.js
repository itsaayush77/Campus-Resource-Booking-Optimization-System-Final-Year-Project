const express = require('express');
const router = express.Router();

const {
  getStaffPendingBookings,
  getStaffAnalytics
} = require('../controllers/staffController');
const { getStaffDepartmentResources } = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All staff routes require staff or admin role
// Staff can VIEW pending bookings and analytics, but only ADMIN can approve/reject

router.get('/bookings/pending', protect, authorize('staff', 'admin'), getStaffPendingBookings);
router.get('/analytics', protect, authorize('staff', 'admin'), getStaffAnalytics);
router.get('/resources', protect, authorize('staff', 'admin'), getStaffDepartmentResources);

module.exports = router;
