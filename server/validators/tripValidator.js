const { body, query } = require('express-validator');

const TRAVEL_TYPES = ['domestic', 'international'];
const TRIP_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'];
const SORTABLE_FIELDS = [
  'createdAt', '-createdAt',
  'dates.startDate', '-dates.startDate',
  'budget.estimated', '-budget.estimated',
  'tripNumber', '-tripNumber',
];

// ---------- Create ----------
const createTripValidator = [
  body('origin').trim().notEmpty().withMessage('Origin is required').isLength({ max: 200 }),
  body('destination').trim().notEmpty().withMessage('Destination is required').isLength({ max: 200 }),
  body('travelType')
    .notEmpty()
    .withMessage('Travel type is required')
    .isIn(TRAVEL_TYPES)
    .withMessage(`Travel type must be one of: ${TRAVEL_TYPES.join(', ')}`),
  body('purpose').trim().notEmpty().withMessage('Purpose is required').isLength({ max: 1000 }),
  body('dates.startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Start date must be a valid date'),
  body('dates.endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => new Date(value) >= new Date(req.body?.dates?.startDate))
    .withMessage('End date cannot be before start date'),
  body('budget.estimated')
    .notEmpty()
    .withMessage('Estimated budget is required')
    .isFloat({ gt: 0 })
    .withMessage('Estimated budget must be greater than zero'),
  body('budget.currency').optional().trim().isLength({ min: 3, max: 3 }),
];

// ---------- Update (edit pending trip) - same shape, everything optional ----------
const updateTripValidator = [
  body('origin').optional().trim().notEmpty().isLength({ max: 200 }),
  body('destination').optional().trim().notEmpty().isLength({ max: 200 }),
  body('travelType').optional().isIn(TRAVEL_TYPES).withMessage(`Travel type must be one of: ${TRAVEL_TYPES.join(', ')}`),
  body('purpose').optional().trim().notEmpty().isLength({ max: 1000 }),
  body('dates.startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('dates.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => !req.body?.dates?.startDate || new Date(value) >= new Date(req.body.dates.startDate))
    .withMessage('End date cannot be before start date'),
  body('budget.estimated').optional().isFloat({ gt: 0 }).withMessage('Estimated budget must be greater than zero'),
];

// ---------- Cancel ----------
const cancelTripValidator = [
  body('cancellationReason').optional().trim().isLength({ max: 500 }),
];

// ---------- Approve / Reject ----------
const approveTripValidator = [
  body('approvedBudget').optional().isFloat({ min: 0 }).withMessage('Approved budget must be a positive number'),
  body('comments').optional().trim().isLength({ max: 1000 }),
];

const rejectTripValidator = [
  body('comments').trim().notEmpty().withMessage('A reason is required when rejecting a trip').isLength({ max: 1000 }),
];

// ---------- Comments ----------
const addCommentValidator = [
  body('message').trim().notEmpty().withMessage('Comment message is required').isLength({ max: 1000 }),
];

// ---------- List query (pagination / filtering / searching / sorting) ----------
const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(TRIP_STATUSES).withMessage(`status must be one of: ${TRIP_STATUSES.join(', ')}`),
  query('travelType').optional().isIn(TRAVEL_TYPES),
  query('department').optional().isMongoId().withMessage('department must be a valid ID'),
  query('search').optional().trim().isLength({ max: 200 }),
  query('sort').optional().isIn(SORTABLE_FIELDS).withMessage(`sort must be one of: ${SORTABLE_FIELDS.join(', ')}`),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
];

module.exports = {
  createTripValidator,
  updateTripValidator,
  cancelTripValidator,
  approveTripValidator,
  rejectTripValidator,
  addCommentValidator,
  listQueryValidator,
};
