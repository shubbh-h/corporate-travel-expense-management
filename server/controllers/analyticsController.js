const asyncHandler = require('express-async-handler');
const analyticsService = require('../services/analyticsService');

// @route GET /api/analytics/admin-dashboard
const getAdminDashboard = asyncHandler(async (req, res) => {
  const dashboard = await analyticsService.getAdminDashboard();
  res.status(200).json({ success: true, data: dashboard });
});

// @route GET /api/analytics/trips
const getTripAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getTripAnalytics();
  res.status(200).json({ success: true, data: analytics });
});

// @route GET /api/analytics/expenses
const getExpenseAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getExpenseAnalytics();
  res.status(200).json({ success: true, data: analytics });
});

module.exports = {
  getAdminDashboard,
  getTripAnalytics,
  getExpenseAnalytics,
};
