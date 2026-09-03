const asyncHandler = require('express-async-handler');
const approvalService = require('../services/approvalService');

// @route POST /api/approvals/:type/:id/approve
const approve = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const entity = await approvalService.approveRequest(req.user, type, id, req.body);
  res.status(200).json({ success: true, message: `${type} approved successfully`, data: { [type]: entity } });
});

// @route POST /api/approvals/:type/:id/reject
const reject = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const entity = await approvalService.rejectRequest(req.user, type, id, req.body);
  res.status(200).json({ success: true, message: `${type} rejected successfully`, data: { [type]: entity } });
});

// @route POST /api/approvals/:type/:id/request-changes
const requestChanges = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const entity = await approvalService.requestChanges(req.user, type, id, req.body);
  res.status(200).json({ success: true, message: 'Changes requested successfully', data: { [type]: entity } });
});

// @route POST /api/approvals/:type/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const entity = await approvalService.addApprovalComment(req.user, type, id, req.body.message);
  res.status(201).json({ success: true, message: 'Comment added successfully', data: { [type]: entity } });
});

// @route GET /api/approvals/:type/:id/history
const getHistory = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const history = await approvalService.getApprovalHistory(req.user, type, id, req.query);
  res.status(200).json({ success: true, data: { history } });
});

// @route GET /api/approvals/:type/:id/timeline
const getTimeline = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const timeline = await approvalService.getApprovalTimeline(req.user, type, id);
  res.status(200).json({ success: true, data: timeline });
});

module.exports = { approve, reject, requestChanges, addComment, getHistory, getTimeline };
