const asyncHandler = require('express-async-handler');
const notificationService = require('../services/notificationService');

// @route GET /api/notifications/my
const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route GET /api/notifications/count
const getNotificationCount = asyncHandler(async (req, res) => {
  const counts = await notificationService.getNotificationCount(req.user._id);
  res.status(200).json({ success: true, data: counts });
});

// @route PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  res.status(200).json({ success: true, message: 'Notification marked as read', data: { notification } });
});

// @route PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res.status(200).json({ success: true, message: `${result.modifiedCount} notification(s) marked as read` });
});

// @route DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.softDeleteNotification(req.user._id, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// @route GET /api/notifications/team
const getTeamNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getTeamNotifications(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/notifications/user
const sendToUser = asyncHandler(async (req, res) => {
  const notification = await notificationService.sendToUser(req.user, req.body);
  res.status(201).json({ success: true, message: 'Notification sent', data: { notification } });
});

// @route POST /api/notifications/bulk
const sendToMultipleUsers = asyncHandler(async (req, res) => {
  const result = await notificationService.sendToMultipleUsers(req.user, req.body);
  res.status(201).json({ success: true, message: `Notification sent to ${result.count} user(s)`, data: result });
});

// @route POST /api/notifications/department
const sendToDepartment = asyncHandler(async (req, res) => {
  const result = await notificationService.sendToDepartment(req.user, req.body);
  res.status(201).json({ success: true, message: `Notification sent to ${result.count} user(s)`, data: result });
});

// @route POST /api/notifications/broadcast
const broadcast = asyncHandler(async (req, res) => {
  const result = await notificationService.broadcastNotification(req.user, req.body);
  res.status(201).json({ success: true, message: `Broadcast sent to ${result.count} user(s)`, data: result });
});

// @route GET /api/notifications/history
const getNotificationHistory = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotificationHistory(req.query);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  getMyNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getTeamNotifications,
  sendToUser,
  sendToMultipleUsers,
  sendToDepartment,
  broadcast,
  getNotificationHistory,
};
