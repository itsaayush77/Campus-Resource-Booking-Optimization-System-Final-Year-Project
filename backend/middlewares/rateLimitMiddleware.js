const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

const loginRateLimiter = createLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  message: 'Too many login attempts. Please try again later.',
});

const forgotPasswordRateLimiter = createLimiter({
  windowMs: Number(process.env.FORGOT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.FORGOT_RATE_LIMIT_MAX) || 5,
  message: 'Too many password reset requests. Please try again later.',
});

module.exports = {
  loginRateLimiter,
  forgotPasswordRateLimiter,
};
