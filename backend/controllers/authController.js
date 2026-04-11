const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '7d';
const isProduction = process.env.NODE_ENV === 'production';
const shouldExposeDevResetLink = !isProduction && process.env.EXPOSE_RESET_LINK === 'true';
const forgotPasswordMessage =
  'If an account with that email exists, a password reset link has been sent.';

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber,
  department: user.department,
  profilePicture: user.profilePicture,
  noShowCount: user.noShowCount,
  isSuspended: user.isSuspended,
  suspendedUntil: user.suspendedUntil,
  isActive: user.isActive,
  createdAt: user.createdAt
});
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, department } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }


    
    // Lock role assignment for public signup: never allow direct admin creation.
    const safeRole = ['student', 'staff'].includes(String(role || '').toLowerCase())
      ? String(role).toLowerCase()
      : 'student';

    // Create user (password will be hashed automatically by User model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      phoneNumber,
      department
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      tokenExpiresIn: JWT_EXPIRES_IN,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: msg || 'Invalid registration data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Check if suspended
    if (user.isSuspended) {
      if (user.suspendedUntil && user.suspendedUntil > Date.now()) {
        return res.status(403).json({
          success: false,
          message: `Account suspended until ${user.suspendedUntil.toLocaleDateString()}`
        });
      } else {
        // Suspension expired, reset
        user.isSuspended = false;
        user.suspendedUntil = null;
        await user.save();
      }
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      tokenExpiresIn: JWT_EXPIRES_IN,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, department } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters and include at least one letter and one number'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return the same response to avoid email enumeration.
    const safeResponse = {
      success: true,
      message: forgotPasswordMessage
    };

    if (!email) {
      return res.status(200).json(safeResponse);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json(safeResponse);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      const delivery = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      const response = { ...safeResponse };
      if (shouldExposeDevResetLink) {
        response.devResetUrl = resetUrl;
        if (delivery?.previewUrl) {
          response.emailPreviewUrl = delivery.previewUrl;
        }
      }

      return res.status(200).json(response);
    } catch (emailError) {
      if (shouldExposeDevResetLink) {
        return res.status(200).json({
          ...safeResponse,
          devResetUrl: resetUrl,
          deliveryWarning:
            'Email delivery failed in development mode. Use devResetUrl directly for testing.',
        });
      }

      // Avoid keeping a usable token when delivery fails in production-like mode.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Unable to send reset email at this time. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;

    if (!newPassword || newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include at least one letter and one number'
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
