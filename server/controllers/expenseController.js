const asyncHandler = require('express-async-handler');
const expenseService = require('../services/expenseService');

// @route POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.user, req.body);
  res.status(201).json({ success: true, message: 'Expense created successfully', data: { expense } });
});

// @route GET /api/expenses/my
const getMyExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getMyExpenses(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route GET /api/expenses/history
const getExpenseHistory = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenseHistory(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route GET /api/expenses/:id
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.user, req.params.id);
  res.status(200).json({ success: true, data: { expense } });
});

// @route PATCH /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Expense updated successfully', data: { expense } });
});

// @route DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// @route GET /api/expenses/pending
const getPendingExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getPendingExpenses(req.query);
  res.status(200).json({ success: true, data: result });
});

// @route PUT /api/expenses/:id/approve
const approveExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.approveExpense(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Expense approved successfully', data: { expense } });
});

// @route PUT /api/expenses/:id/reject
const rejectExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.rejectExpense(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Expense rejected successfully', data: { expense } });
});

// @route PUT /api/expenses/:id/reimburse
const markExpenseAsReimbursed = asyncHandler(async (req, res) => {
  const expense = await expenseService.markExpenseAsReimbursed(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Expense marked as reimbursed', data: { expense } });
});

// @route GET /api/expenses/stats
const getExpenseStatistics = asyncHandler(async (req, res) => {
  const stats = await expenseService.getExpenseStatistics();
  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  createExpense,
  getMyExpenses,
  getExpenseHistory,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getPendingExpenses,
  approveExpense,
  rejectExpense,
  markExpenseAsReimbursed,
  getExpenseStatistics,
};
