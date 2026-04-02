const express = require('express');
const router = express.Router();

const {
  getResources,
  getResourceById,
  getResourceBookings,
  createResource,
  updateResource,
  deleteResource,
  toggleResourceStatus
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getResources);
router.get('/:id/bookings', protect, getResourceBookings);
router.get('/:id', getResourceById);
router.post('/', protect, authorize('admin'), createResource);
router.put('/:id', protect, authorize('admin'), updateResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);
router.patch('/:id/toggle', protect, authorize('admin'), toggleResourceStatus);

module.exports = router;
