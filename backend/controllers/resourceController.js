const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const Booking = require('../models/Bookings');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

const parseDateParam = (value, fallbackDate) => {
  if (!value) return fallbackDate;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getDefaultAvailabilityRange = () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    const { category, type, search, isActive } = req.query;
    const query = {};

    if (category) query.category = category.toLowerCase();
    if (type) query.type = new RegExp(type, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Public users only see active resources unless explicitly admin.
    if (req.user?.role === 'admin') {
      const parsedIsActive = parseBoolean(isActive);
      if (parsedIsActive !== undefined) query.isActive = parsedIsActive;
    } else {
      query.isActive = true;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
      error: error.message
    });
  }
};

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (!resource.isActive && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    return res.status(200).json({
      success: true,
      resource
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resource',
      error: error.message
    });
  }
};

// @desc    Get resource booking availability for calendar view
// @route   GET /api/resources/:id/bookings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private
exports.getResourceBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const defaults = getDefaultAvailabilityRange();
    const startDate = parseDateParam(req.query.startDate, defaults.startDate);
    const endDate = parseDateParam(req.query.endDate, defaults.endDate);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate'
      });
    }

    const resource = await Resource.findById(id).select('name availability isActive');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (!resource.isActive && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const bookings = await Booking.find({
      resourceId: id,
      // Keep availability aligned with booking conflict logic (pending + approved only).
      status: { $in: ['pending', 'approved'] },
      startTime: { $lt: endDate },
      endTime: { $gt: startDate }
    })
      .populate('userId', 'name')
      .select('startTime endTime status purpose userId')
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      resource,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resource availability',
      error: error.message
    });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private/Admin
exports.createResource = async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const resource = await Resource.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create resource',
      error: error.message
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    const resource = await Resource.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update resource',
      error: error.message
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    const now = new Date();
    const futureBookingsCount = await Booking.countDocuments({
      resourceId: id,
      status: { $in: ['pending', 'approved'] },
      endTime: { $gt: now }
    });

    if (futureBookingsCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this resource because it has ${futureBookingsCount} upcoming active booking(s).`,
        errorCode: 'RESOURCE_HAS_FUTURE_BOOKINGS',
        suggestion: 'Deactivate (archive) the resource instead, then resolve or cancel future bookings first.'
      });
    }

    const resource = await Resource.findByIdAndDelete(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
      resource
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error.message
    });
  }
};

// @desc    Toggle resource active status
// @route   PATCH /api/resources/:id/toggle
// @access  Private/Admin
exports.toggleResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID'
      });
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    resource.isActive = !resource.isActive;
    resource.updatedAt = new Date();
    await resource.save();

    return res.status(200).json({
      success: true,
      message: `Resource ${resource.isActive ? 'activated' : 'deactivated'} successfully`,
      resource
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle resource status',
      error: error.message
    });
  }
};

// @desc    Get resources assigned to staff member
// @route   GET /api/staff/resources
// @access  Private/Staff
exports.getStaffDepartmentResources = async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findById(req.user._id).select('assignedResources');
    
    if (!user || !user.assignedResources.length) {
      return res.status(200).json({
        success: true,
        message: 'No resources assigned',
        resources: []
      });
    }

    const resources = await Resource.find({
      _id: { $in: user.assignedResources }
    }).lean();

    return res.status(200).json({
      success: true,
      message: `Found ${resources.length} assigned resource(s)`,
      resources
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned resources',
      error: error.message
    });
  }
};
