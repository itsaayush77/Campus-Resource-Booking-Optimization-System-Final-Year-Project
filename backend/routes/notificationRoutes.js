const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsRead,
  markManyNotificationsAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllNotificationsAsRead);
router.patch('/read-many', protect, markManyNotificationsAsRead);
router.patch('/:id/read', protect, markNotificationAsRead);

module.exports = router;
