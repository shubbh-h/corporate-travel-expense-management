const express = require('express');
const { param } = require('express-validator');
const router = express.Router();

const expenseController = require('../controllers/expenseController');
const {
  createExpenseValidator,
  updateExpenseValidator,
  listQueryValidator,
  approveExpenseValidator,
  rejectExpenseValidator,
  reimburseExpenseValidator,
} = require('../validators/expenseValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid expense ID')];

// All expense routes require an authenticated user; ownership is enforced in expenseService.
router.use(protect);

router.post('/', createExpenseValidator, validateRequest, expenseController.createExpense);
router.get('/my', listQueryValidator, validateRequest, expenseController.getMyExpenses);
router.get('/history', listQueryValidator, validateRequest, expenseController.getExpenseHistory);

// ---------- Finance / Admin ----------
router.get('/pending', authorize('Finance', 'Admin'), listQueryValidator, validateRequest, expenseController.getPendingExpenses);
router.get('/stats', authorize('Finance', 'Admin'), expenseController.getExpenseStatistics);
router.put('/:id/approve', authorize('Finance', 'Admin'), idParamValidator, approveExpenseValidator, validateRequest, expenseController.approveExpense);
router.put('/:id/reject', authorize('Finance', 'Admin'), idParamValidator, rejectExpenseValidator, validateRequest, expenseController.rejectExpense);
router.put('/:id/reimburse', authorize('Finance', 'Admin'), idParamValidator, reimburseExpenseValidator, validateRequest, expenseController.markExpenseAsReimbursed);

// ---------- Employee (owner-scoped, enforced in expenseService) ----------
router.get('/:id', idParamValidator, validateRequest, expenseController.getExpenseById);
router.patch('/:id', idParamValidator, updateExpenseValidator, validateRequest, expenseController.updateExpense);
router.delete('/:id', idParamValidator, validateRequest, expenseController.deleteExpense);

module.exports = router;
