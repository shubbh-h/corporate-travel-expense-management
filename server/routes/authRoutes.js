const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// ---------- Public routes ----------
router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/refresh', authLimiter, authController.refresh);

// ---------- Protected routes (require a valid access token) ----------
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/change-password', protect, changePasswordValidator, validateRequest, authController.changePassword);

module.exports = router;
