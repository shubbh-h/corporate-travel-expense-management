const express = require('express');
const router = express.Router();

const approvalController = require('../controllers/approvalController');
const {
  typeParamValidator,
  idParamValidator,
  approveValidator,
  rejectValidator,
  requestChangesValidator,
  commentValidator,
  historyQueryValidator,
} = require('../validators/approvalValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// All approval routes require an authenticated user.
router.use(protect);

// ---------- Decision actions (Manager for trips, Finance for expenses, Admin for
// either - the broad role gate below is refined per-type inside approvalService) ----------
router.post(
  '/:type/:id/approve',
  typeParamValidator,
  idParamValidator,
  approveValidator,
  validateRequest,
  authorize('Manager', 'Finance', 'Admin'),
  approvalController.approve
);

router.post(
  '/:type/:id/reject',
  typeParamValidator,
  idParamValidator,
  rejectValidator,
  validateRequest,
  authorize('Manager', 'Finance', 'Admin'),
  approvalController.reject
);

router.post(
  '/:type/:id/request-changes',
  typeParamValidator,
  idParamValidator,
  requestChangesValidator,
  validateRequest,
  authorize('Manager', 'Finance', 'Admin'),
  approvalController.requestChanges
);

// ---------- Comment / history / timeline - open to any authenticated user;
// fine-grained owner/approver/admin access is enforced in approvalService ----------
router.post('/:type/:id/comments', typeParamValidator, idParamValidator, commentValidator, validateRequest, approvalController.addComment);
router.get('/:type/:id/history', typeParamValidator, idParamValidator, historyQueryValidator, validateRequest, approvalController.getHistory);
router.get('/:type/:id/timeline', typeParamValidator, idParamValidator, validateRequest, approvalController.getTimeline);

module.exports = router;
