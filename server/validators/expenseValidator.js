const { body, query } = require('express-validator');

const CATEGORIES = ['hotel', 'flight', 'train', 'cab', 'food', 'miscellaneous'];

// ---------- Create ----------
const createExpenseValidator = [
  body('trip').notEmpty().withMessage('Trip ID is required').isMongoId().withMessage('Trip ID must be a valid ID'),
  body('category').notEmpty().withMessage('Category is required').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 500 }),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('currency')
    .notEmpty()
    .withMessage('Currency is required')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code (e.g. INR, USD)'),
  body('expenseDate')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Expense date must be a valid date')
    .custom((value) => new Date(value) <= new Date())
    .withMessage('Expense date cannot be in the future'),
  body('merchantName').trim().notEmpty().withMessage('Merchant name is required').isLength({ max: 200 }),
  body('receiptNumber').trim().notEmpty().withMessage('Receipt number is required').isLength({ max: 100 }),
  body('invoiceNumber').optional().trim().isLength({ max: 100 }),
  body('gstNumber').optional().trim().isLength({ max: 50 }),
];

// ---------- Update (edit pending expense) - same shape, everything optional, trip is immutable ----------
const updateExpenseValidator = [
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('description').optional().trim().notEmpty().isLength({ max: 500 }),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Expense date must be a valid date')
    .custom((value) => new Date(value) <= new Date())
    .withMessage('Expense date cannot be in the future'),
  body('merchantName').optional().trim().notEmpty().isLength({ max: 200 }),
  body('receiptNumber').optional().trim().notEmpty().isLength({ max: 100 }),
  body('invoiceNumber').optional().trim().isLength({ max: 100 }),
  body('gstNumber').optional().trim().isLength({ max: 50 }),
];

// ---------- List query (pagination / filtering / searching / sorting) ----------
const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('category').optional().isIn(CATEGORIES),
  query('trip').optional().isMongoId().withMessage('trip must be a valid ID'),
  query('search').optional().trim().isLength({ max: 200 }),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'expenseDate', '-expenseDate', 'amount', '-amount']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('includeDeleted').optional().isBoolean(),
];

// ---------- Finance: approve / reject / reimburse ----------
const approveExpenseValidator = [body('comments').optional().trim().isLength({ max: 1000 })];

const rejectExpenseValidator = [
  body('comments').trim().notEmpty().withMessage('A reason is required when rejecting an expense').isLength({ max: 1000 }),
];

const reimburseExpenseValidator = [body('transactionReference').optional().trim().isLength({ max: 100 })];

module.exports = {
  createExpenseValidator,
  updateExpenseValidator,
  listQueryValidator,
  approveExpenseValidator,
  rejectExpenseValidator,
  reimburseExpenseValidator,
};
