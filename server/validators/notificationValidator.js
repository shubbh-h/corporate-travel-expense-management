const { body, query, param } = require('express-validator');

const TYPES = ['trip', 'expense', 'approval', 'finance', 'system', 'reminder', 'security'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ---------- Shared field-level rules ----------
const titleRule = body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 });
const messageRule = body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 });
const priorityRule = body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`);
const typeRule = body('type').optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`);

// ---------- Admin: send to a single user ----------
const sendToUserValidator = [
  titleRule,
  messageRule,
  priorityRule,
  typeRule,
  body('receiverId').notEmpty().withMessage('receiverId is required').isMongoId().withMessage('receiverId must be a valid ID'),
  body('link').optional().trim(),
];

// ---------- Admin: send to multiple users ----------
const sendToMultipleValidator = [
  titleRule,
  messageRule,
  priorityRule,
  typeRule,
  body('receiverIds').isArray({ min: 1 }).withMessage('receiverIds must be a non-empty array'),
  body('receiverIds.*').isMongoId().withMessage('Each receiverId must be a valid ID'),
  body('link').optional().trim(),
];

// ---------- Admin: send to a department ----------
const sendToDepartmentValidator = [
  titleRule,
  messageRule,
  priorityRule,
  typeRule,
  body('departmentId').notEmpty().withMessage('departmentId is required').isMongoId().withMessage('departmentId must be a valid ID'),
  body('link').optional().trim(),
];

// ---------- Admin: broadcast to everyone ----------
const broadcastValidator = [
  titleRule,
  messageRule,
  priorityRule,
  typeRule,
  body('link').optional().trim(),
];

// ---------- :id param used by mark-as-read / delete ----------
const idParamValidator = [param('id').isMongoId().withMessage('Invalid notification ID')];

// ---------- List query (pagination / filtering / searching / sorting) ----------
const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('type').optional().isIn(TYPES).withMessage(`type must be one of: ${TYPES.join(', ')}`),
  query('priority').optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),
  query('isRead').optional().isBoolean().withMessage('isRead must be true or false'),
  query('search').optional().trim().isLength({ max: 200 }),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'priority', '-priority']),
];

module.exports = {
  sendToUserValidator,
  sendToMultipleValidator,
  sendToDepartmentValidator,
  broadcastValidator,
  idParamValidator,
  listQueryValidator,
};
