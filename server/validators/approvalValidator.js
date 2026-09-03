const { param, body, query } = require('express-validator');

const APPROVAL_TYPES = ['trip', 'expense'];

const typeParamValidator = [
  param('type').isIn(APPROVAL_TYPES).withMessage(`type must be one of: ${APPROVAL_TYPES.join(', ')}`),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid ID')];

const approveValidator = [body('comments').optional().trim().isLength({ max: 1000 })];

const rejectValidator = [
  body('comments').trim().notEmpty().withMessage('A rejection reason is required').isLength({ max: 1000 }),
];

const requestChangesValidator = [
  body('comments').trim().notEmpty().withMessage('A description of the requested changes is required').isLength({ max: 1000 }),
];

const commentValidator = [
  body('message').trim().notEmpty().withMessage('Comment message is required').isLength({ max: 1000 }),
];

const historyQueryValidator = [query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200')];

module.exports = {
  typeParamValidator,
  idParamValidator,
  approveValidator,
  rejectValidator,
  requestChangesValidator,
  commentValidator,
  historyQueryValidator,
};
