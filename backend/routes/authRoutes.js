const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  validate,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../middlewares/validationMiddleware');
const {
  loginRateLimiter,
  forgotPasswordRateLimiter,
} = require('../middlewares/rateLimitMiddleware');

// Public routes 
router.post('/register', registerValidation, validate, register);
router.post('/login', loginRateLimiter, loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;