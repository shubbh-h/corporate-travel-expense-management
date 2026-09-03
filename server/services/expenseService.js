const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

const EDITABLE_VERIFICATION_STATUSES = ['pending'];
const EDITABLE_FINANCE_STATUSES = ['pending'];

// ============================================================
// Shared helpers
// ============================================================

const buildListOptions = (queryParams, baseFilter = {}) => {
  const { category, trip, search, sort, dateFrom, dateTo, page, limit, includeDeleted } = queryParams;

  const filter = { ...baseFilter };
  if (!(includeDeleted === 'true' || includeDeleted === true)) filter.isDeleted = false;

  if (category) filter.category = category;
  if (trip) filter.trip = trip;

  if (dateFrom || dateTo) {
    filter.expenseDate = {};
    if (dateFrom) filter.expenseDate.$gte = new Date(dateFrom);
    if (dateTo) filter.expenseDate.$lte = new Date(dateTo);
  }

  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
      { merchantName: { $regex: search, $options: 'i' } },
      { receiptNumber: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { expenseNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  const sortObj = sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 };

  return { filter, sortObj, skip, limitNum };
};

const paginate = async (filter, sortObj, skip, limitNum) => {
  const [expenses, total] = await Promise.all([
    Expense.find(filter).populate('trip', 'tripNumber destination').sort(sortObj).skip(skip).limit(limitNum),
    Expense.countDocuments(filter),
  ]);

  return {
    expenses,
    pagination: { total, page: skip / limitNum + 1, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
  };
};

/**
 * Loads an expense the given user owns, or throws. Centralizes the
 * "expense must belong to the logged-in employee" business rule.
 */
const findOwnExpenseOrThrow = async (userId, expenseId, { includeDeleted = false } = {}) => {
  const filter = { _id: expenseId };
  if (!includeDeleted) filter.isDeleted = false;

  const expense = await Expense.findOne(filter);
  if (!expense) throw new AppError('Expense not found', 404);
  if (String(expense.employee) !== String(userId)) {
    throw new AppError('You can only access your own expenses', 403);
  }
  return expense;
};

/**
 * Loads the referenced trip, confirms it exists, belongs to the same
 * employee, and that the given expense date falls within the trip's dates.
 */
const assertTripIsValidForExpense = async (userId, tripId, expenseDate) => {
  const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
  if (!trip) throw new AppError('The referenced trip does not exist', 404);

  if (String(trip.employee) !== String(userId)) {
    throw new AppError('You can only file expenses against your own trips', 403);
  }

  const date = new Date(expenseDate);
  if (date < trip.dates.startDate || date > trip.dates.endDate) {
    throw new AppError('Expense date must fall within the trip dates', 400);
  }

  return trip;
};

const assertExpenseIsEditable = (expense) => {
  const notEditable =
    !EDITABLE_VERIFICATION_STATUSES.includes(expense.verificationStatus) ||
    !EDITABLE_FINANCE_STATUSES.includes(expense.financeStatus);

  if (notEditable) {
    throw new AppError('Approved or rejected expenses cannot be edited', 400);
  }
};

/**
 * Notifies the employee's manager that a new expense was submitted, using
 * the existing NotificationService. Failures are logged, never thrown, so
 * a notification issue can never block expense creation.
 */
const notifyManagerOfNewExpense = async (expense) => {
  try {
    const employee = await User.findById(expense.employee).select('manager');
    if (!employee?.manager) return;

    await notificationService.createNotification({
      receiver: employee.manager,
      title: 'New Expense Submitted',
      message: `A new ${expense.category} expense of ${expense.amount} ${expense.currency} was submitted for review.`,
      priority: 'medium',
      type: 'expense',
      link: `/expenses/${expense.expenseNumber}`,
      relatedEntity: { entityType: 'Expense', entityId: expense._id },
    });
  } catch (err) {
    console.error('[expenseService] Failed to notify manager of new expense:', err.message);
  }
};

// ============================================================
// Employee actions
// ============================================================

const createExpense = async (user, payload) => {
  await assertTripIsValidForExpense(user._id, payload.trip, payload.expenseDate);

  const expense = await Expense.create({
    ...payload,
    employee: user._id,
    department: user.department,
  });

  await notifyManagerOfNewExpense(expense);
  return expense;
};

const getMyExpenses = async (userId, queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, { employee: userId });
  return paginate(filter, sortObj, skip, limitNum);
};

const getExpenseById = async (user, expenseId) => {
  const expense = await findOwnExpenseOrThrow(user._id, expenseId, { includeDeleted: true });
  await expense.populate('trip', 'tripNumber destination dates');
  await expense.populate('comments.author', 'firstName lastName email');
  return expense;
};

const updateExpense = async (user, expenseId, payload) => {
  const expense = await findOwnExpenseOrThrow(user._id, expenseId);
  assertExpenseIsEditable(expense);

  const { category, description, amount, currency, expenseDate, merchantName, receiptNumber, invoiceNumber, gstNumber } = payload;

  // Trip is intentionally immutable after creation - changing it would require
  // re-validating trip ownership and trip-date bounds against a different trip entirely.
  if (expenseDate) {
    if (expense.trip) await assertTripIsValidForExpense(user._id, expense.trip, expenseDate);
    expense.expenseDate = expenseDate;
  }

  if (category) expense.category = category;
  if (description) expense.description = description;
  if (amount) expense.amount = amount;
  if (currency) expense.currency = currency;
  if (merchantName) expense.merchantName = merchantName;
  if (receiptNumber) expense.receiptNumber = receiptNumber;
  if (invoiceNumber !== undefined) expense.invoiceNumber = invoiceNumber;
  if (gstNumber !== undefined) expense.gstNumber = gstNumber;

  await expense.save();
  return expense;
};

const deleteExpense = async (user, expenseId) => {
  const expense = await findOwnExpenseOrThrow(user._id, expenseId);
  assertExpenseIsEditable(expense);

  expense.isDeleted = true;
  expense.deletedAt = new Date();
  await expense.save({ validateBeforeSave: false });

  return { message: `Expense ${expense.expenseNumber} was deleted` };
};

/**
 * Full personal audit trail: includes soft-deleted expenses by default,
 * unlike getMyExpenses which only shows active ones.
 */
const getExpenseHistory = async (userId, queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(
    { ...queryParams, includeDeleted: queryParams.includeDeleted ?? 'true' },
    { employee: userId }
  );
  return paginate(filter, sortObj, skip, limitNum);
};

/**
 * Notifies the expense's employee about a Finance decision, using the
 * existing NotificationService. Failures are logged, never thrown, so a
 * notification issue can never block the underlying finance action.
 */
const notifyEmployeeOfFinanceEvent = async (expense, eventType) => {
  const messages = {
    approved: {
      title: 'Expense Approved',
      message: `Your ${expense.category} expense of ${expense.amount} ${expense.currency} (${expense.expenseNumber}) has been approved by Finance.`,
    },
    rejected: {
      title: 'Expense Rejected',
      message: `Your ${expense.category} expense of ${expense.amount} ${expense.currency} (${expense.expenseNumber}) has been rejected by Finance.`,
    },
    reimbursed: {
      title: 'Expense Reimbursed',
      message: `Your ${expense.category} expense of ${expense.amount} ${expense.currency} (${expense.expenseNumber}) has been reimbursed.`,
    },
  };

  try {
    const config = messages[eventType];
    if (!config) return;

    await notificationService.createNotification({
      receiver: expense.employee,
      title: config.title,
      message: config.message,
      priority: 'high',
      type: 'finance',
      link: `/expenses/${expense.expenseNumber}`,
      relatedEntity: { entityType: 'Expense', entityId: expense._id },
    });
  } catch (err) {
    console.error(`[expenseService] Failed to notify employee of expense "${eventType}":`, err.message);
  }
};

// ============================================================
// Finance actions
// ============================================================

/**
 * All expenses awaiting a Finance decision. Deliberately does not factor in
 * verificationStatus (manager-level verification is a separate, not-yet-built
 * workflow) - Finance reviews directly off financeStatus.
 */
const getPendingExpenses = async (queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, { financeStatus: 'pending' });
  return paginate(filter, sortObj, skip, limitNum);
};

const approveExpense = async (financeUser, expenseId, { comments } = {}) => {
  const expense = await Expense.findOne({ _id: expenseId, isDeleted: false });
  if (!expense) throw new AppError('Expense not found', 404);

  if (expense.financeStatus !== 'pending') {
    throw new AppError(`Cannot approve an expense that is already ${expense.financeStatus}`, 400);
  }

  expense.financeStatus = 'approved';
  expense.financeReviewedBy = financeUser._id;
  expense.financeReviewedAt = new Date();
  if (comments) expense.comments.push({ author: financeUser._id, message: comments });

  await expense.save();
  await notifyEmployeeOfFinanceEvent(expense, 'approved');
  return expense;
};

const rejectExpense = async (financeUser, expenseId, { comments }) => {
  const expense = await Expense.findOne({ _id: expenseId, isDeleted: false });
  if (!expense) throw new AppError('Expense not found', 404);

  if (expense.financeStatus !== 'pending') {
    throw new AppError(`Cannot reject an expense that is already ${expense.financeStatus}`, 400);
  }

  expense.financeStatus = 'rejected';
  expense.financeReviewedBy = financeUser._id;
  expense.financeReviewedAt = new Date();
  expense.comments.push({ author: financeUser._id, message: comments });

  await expense.save();
  await notifyEmployeeOfFinanceEvent(expense, 'rejected');
  return expense;
};

/**
 * "Reimbursement only after approval" - a rejected expense must be
 * resubmitted (a new expense created) rather than reimbursed directly,
 * since only an 'approved' expense can transition to 'reimbursed'.
 */
const markExpenseAsReimbursed = async (financeUser, expenseId, { transactionReference } = {}) => {
  const expense = await Expense.findOne({ _id: expenseId, isDeleted: false });
  if (!expense) throw new AppError('Expense not found', 404);

  if (expense.financeStatus !== 'approved') {
    throw new AppError('Only approved expenses can be marked as reimbursed', 400);
  }

  expense.financeStatus = 'reimbursed';
  expense.reimbursedBy = financeUser._id;
  expense.reimbursedAt = new Date();
  if (transactionReference) {
    expense.comments.push({ author: financeUser._id, message: `Reimbursed - reference: ${transactionReference}` });
  }

  await expense.save();
  await notifyEmployeeOfFinanceEvent(expense, 'reimbursed');
  return expense;
};

const getExpenseStatistics = async () => {
  const [statusCounts, categoryBreakdown, totals] = await Promise.all([
    Expense.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$financeStatus', count: { $sum: 1 } } }]),
    Expense.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$amountInBaseCurrency' } } },
    ]),
    Expense.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalAmount: { $sum: '$amountInBaseCurrency' }, avgAmount: { $avg: '$amountInBaseCurrency' }, count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = statusCounts.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
  const categoryStats = categoryBreakdown.reduce(
    (acc, { _id, count, totalAmount }) => ({ ...acc, [_id]: { count, totalAmount: totalAmount || 0 } }),
    {}
  );
  const totalExpenses = statusCounts.reduce((sum, { count }) => sum + count, 0);

  return {
    totalExpenses,
    pending: byStatus.pending || 0,
    approved: byStatus.approved || 0,
    rejected: byStatus.rejected || 0,
    reimbursed: byStatus.reimbursed || 0,
    totalAmount: totals[0]?.totalAmount || 0,
    averageAmount: Math.round((totals[0]?.avgAmount || 0) * 100) / 100,
    categoryBreakdown: categoryStats,
  };
};

module.exports = {
  createExpense,
  getMyExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseHistory,
  getPendingExpenses,
  approveExpense,
  rejectExpense,
  markExpenseAsReimbursed,
  getExpenseStatistics,
};
