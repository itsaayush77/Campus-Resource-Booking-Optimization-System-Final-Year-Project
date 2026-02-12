const express = require('express');
const router = express.Router();

const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  toggleResourceStatus
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/', protect, authorize('admin'), createResource);
router.put('/:id', protect, authorize('admin'), updateResource);
router.patch('/:id/toggle', protect, authorize('admin'), toggleResourceStatus);

module.exports = router;
