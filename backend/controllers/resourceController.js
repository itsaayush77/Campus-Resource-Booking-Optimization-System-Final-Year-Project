const mongoose = require('mongoose');
const Resource = require('../models/Resource');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
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
