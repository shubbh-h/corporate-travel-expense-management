const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/env');

// General API rate limiter - applied to all /api routes
const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Stricter limiter for auth endpoints (login/register/forgot-password) to slow brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: rateLimitConfig.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

module.exports = { apiLimiter, authLimiter };
