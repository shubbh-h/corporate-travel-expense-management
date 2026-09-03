const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// All analytics routes require an authenticated user.
router.use(protect);

router.get('/admin-dashboard', authorize('Admin'), analyticsController.getAdminDashboard);
router.get('/trips', authorize('Admin', 'Finance', 'Manager'), analyticsController.getTripAnalytics);
router.get('/expenses', authorize('Admin', 'Finance'), analyticsController.getExpenseAnalytics);

module.exports = router;
