const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const {
  sendToUserValidator,
  sendToMultipleValidator,
  sendToDepartmentValidator,
  broadcastValidator,
  idParamValidator,
  listQueryValidator,
} = require('../validators/notificationValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// All notification routes require an authenticated user.
router.use(protect);

// ---------- Employee ----------
router.get('/my', listQueryValidator, validateRequest, notificationController.getMyNotifications);
router.get('/count', notificationController.getNotificationCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', idParamValidator, validateRequest, notificationController.markAsRead);
router.delete('/:id', idParamValidator, validateRequest, notificationController.deleteNotification);

// ---------- Manager ----------
router.get('/team', authorize('Manager', 'Admin'), listQueryValidator, validateRequest, notificationController.getTeamNotifications);

// ---------- Admin ----------
router.post('/broadcast', authorize('Admin'), broadcastValidator, validateRequest, notificationController.broadcast);
router.post('/user', authorize('Admin'), sendToUserValidator, validateRequest, notificationController.sendToUser);
router.post('/department', authorize('Admin'), sendToDepartmentValidator, validateRequest, notificationController.sendToDepartment);
router.post('/bulk', authorize('Admin'), sendToMultipleValidator, validateRequest, notificationController.sendToMultipleUsers);
router.get('/history', authorize('Admin'), listQueryValidator, validateRequest, notificationController.getNotificationHistory);

module.exports = router;
