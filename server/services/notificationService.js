const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// ============================================================
// Shared helpers
// ============================================================

/**
 * Builds a Mongoose filter + sort + pagination options from a validated
 * query string. Shared by every "list notifications" entry point (my
 * notifications, team notifications, admin history) so the pagination/
 * filtering/searching/sorting logic exists exactly once.
 */
const buildListOptions = (queryParams, baseFilter = {}) => {
  const { type, priority, isRead, search, sort, page, limit } = queryParams;

  const filter = { isDeleted: false, ...baseFilter };

  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (isRead !== undefined) filter['readStatus.isRead'] = isRead === 'true' || isRead === true;
  if (search) {
    filter.$or = [{ title: { $regex: search, $options: 'i' } }, { message: { $regex: search, $options: 'i' } }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  const sortObj = sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 };

  return { filter, sortObj, skip, limitNum };
};

const paginate = async (filter, sortObj, skip, limitNum) => {
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: { total, page: skip / limitNum + 1, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
  };
};

/**
 * Low-level single-notification creator. All other creation paths
 * (bulk send, broadcast, trip-lifecycle triggers) funnel through this.
 */
const createNotification = async (data) => Notification.create(data);

/**
 * Creates the same notification for many recipients in one round trip.
 * Used by broadcast / department / multiple-users sending.
 */
const createBulkNotifications = async (receiverIds, data) => {
  if (!receiverIds.length) return { count: 0 };

  const docs = receiverIds.map((receiverId) => ({ ...data, receiver: receiverId }));
  const result = await Notification.insertMany(docs, { ordered: false });
  return { count: result.length };
};

// ============================================================
// Employee actions
// ============================================================

const getMyNotifications = async (userId, queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, { receiver: userId });
  return paginate(filter, sortObj, skip, limitNum);
};

const getNotificationCount = async (userId) => {
  const [unread, total] = await Promise.all([
    Notification.countDocuments({ receiver: userId, isDeleted: false, 'readStatus.isRead': false }),
    Notification.countDocuments({ receiver: userId, isDeleted: false }),
  ]);
  return { unread, total };
};

/**
 * Loads a notification the given user owns, or throws. Centralizes the
 * "users can only read their own notifications" business rule.
 */
const findOwnNotificationOrThrow = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, isDeleted: false });
  if (!notification) throw new AppError('Notification not found', 404);
  if (String(notification.receiver) !== String(userId)) {
    throw new AppError('You can only access your own notifications', 403);
  }
  return notification;
};

const markAsRead = async (userId, notificationId) => {
  const notification = await findOwnNotificationOrThrow(userId, notificationId);
  notification.readStatus.isRead = true;
  notification.readStatus.readAt = new Date();
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { receiver: userId, isDeleted: false, 'readStatus.isRead': false },
    { $set: { 'readStatus.isRead': true, 'readStatus.readAt': new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
};

const softDeleteNotification = async (userId, notificationId) => {
  const notification = await findOwnNotificationOrThrow(userId, notificationId);
  notification.isDeleted = true;
  notification.deletedAt = new Date();
  await notification.save({ validateBeforeSave: false });
  return { message: 'Notification deleted' };
};

// ============================================================
// Manager actions
// ============================================================

const getTeamNotifications = async (managerId, queryParams) => {
  const teamMemberIds = await User.find({ manager: managerId }).distinct('_id');
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, { receiver: { $in: teamMemberIds } });
  return paginate(filter, sortObj, skip, limitNum);
};

// ============================================================
// Admin actions
// ============================================================

const sendToUser = async (admin, { receiverId, title, message, priority, type, link }) => {
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError('Receiver not found', 404);

  return createNotification({ receiver: receiverId, sender: admin._id, title, message, priority, type: type || 'system', link });
};

const sendToMultipleUsers = async (admin, { receiverIds, title, message, priority, type, link }) => {
  // Only notify IDs that actually resolve to real users, silently dropping the rest.
  const validIds = await User.find({ _id: { $in: receiverIds } }).distinct('_id');
  if (!validIds.length) throw new AppError('None of the provided receiverIds match an existing user', 400);

  return createBulkNotifications(validIds, { sender: admin._id, title, message, priority, type: type || 'system', link });
};

const sendToDepartment = async (admin, { departmentId, title, message, priority, type, link }) => {
  const memberIds = await User.find({ department: departmentId }).distinct('_id');
  if (!memberIds.length) throw new AppError('No users found in this department', 404);

  return createBulkNotifications(memberIds, { sender: admin._id, title, message, priority, type: type || 'system', link });
};

const broadcastNotification = async (admin, { title, message, priority, type, link }) => {
  const allActiveUserIds = await User.find({ accountStatus: 'active' }).distinct('_id');
  return createBulkNotifications(allActiveUserIds, { sender: admin._id, title, message, priority, type: type || 'system', link });
};

/**
 * Admin audit view: every notification in the system, including soft-deleted
 * ones (unless the caller asks to exclude them), for compliance/history review.
 */
const getNotificationHistory = async (queryParams) => {
  const includeDeleted = queryParams.includeDeleted === 'true';
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams);
  if (includeDeleted) delete filter.isDeleted;
  return paginate(filter, sortObj, skip, limitNum);
};

// ============================================================
// Trip lifecycle auto-notification triggers
// ============================================================

/**
 * Central dispatcher for trip-related notifications. Called from tripService
 * at the five trigger points required by this module. Deliberately swallows
 * its own errors (logged, not thrown) so a notification failure never blocks
 * the underlying trip operation that triggered it.
 */
const notifyTripEvent = async (eventType, trip) => {
  try {
    const configs = {
      created: {
        recipientField: 'managerOfEmployee',
        title: 'New Trip Request',
        message: `A new trip request to ${trip.destination} has been submitted for your approval.`,
        priority: 'medium',
      },
      updated: {
        recipientField: 'managerOfEmployee',
        title: 'Trip Request Updated',
        message: `The trip request ${trip.tripNumber} to ${trip.destination} was updated.`,
        priority: 'low',
      },
      cancelled: {
        recipientField: 'managerOfEmployee',
        title: 'Trip Cancelled',
        message: `Trip ${trip.tripNumber} to ${trip.destination} was cancelled by the employee.`,
        priority: 'medium',
      },
      approved: {
        recipientField: 'employee',
        title: 'Trip Approved',
        message: `Your trip request to ${trip.destination} (${trip.tripNumber}) has been approved.`,
        priority: 'high',
      },
      rejected: {
        recipientField: 'employee',
        title: 'Trip Rejected',
        message: `Your trip request to ${trip.destination} (${trip.tripNumber}) has been rejected.`,
        priority: 'high',
      },
    };

    const config = configs[eventType];
    if (!config) return null;

    let receiverId;
    if (config.recipientField === 'employee') {
      receiverId = trip.employee;
    } else {
      const employee = await User.findById(trip.employee).select('manager');
      receiverId = employee?.manager;
    }
    if (!receiverId) return null; // e.g. employee has no manager assigned yet - nothing to notify

    return await createNotification({
      receiver: receiverId,
      title: config.title,
      message: config.message,
      priority: config.priority,
      type: 'approval',
      link: `/trips/${trip.tripNumber}`,
      relatedEntity: { entityType: 'Trip', entityId: trip._id },
    });
  } catch (err) {
    console.error(`[notificationService] Failed to create trip "${eventType}" notification:`, err.message);
    return null;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getMyNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
  getTeamNotifications,
  sendToUser,
  sendToMultipleUsers,
  sendToDepartment,
  broadcastNotification,
  getNotificationHistory,
  notifyTripEvent,
};
