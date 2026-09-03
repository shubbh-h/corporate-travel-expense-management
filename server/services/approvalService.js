const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

/**
 * Per-type configuration. This is the single place that knows how "trip"
 * and "expense" differ - every function below is written against this
 * config rather than branching on `type` directly, so adding a third
 * approvable entity later only means adding a new config entry.
 */
const APPROVAL_CONFIGS = {
  trip: {
    Model: Trip,
    entityLabel: 'Trip',
    statusField: 'status',
    pendingValue: 'pending',
    approvedValue: 'approved',
    rejectedValue: 'rejected',
    completedValues: ['completed'],
    ownerField: 'employee',
    approverRoles: ['Manager'], // Admin is always additionally allowed, checked separately
    requiresTeamOwnership: true, // a Manager must be the direct manager of the trip's employee
    getDisplayId: (doc) => doc.tripNumber,
  },
  expense: {
    Model: Expense,
    entityLabel: 'Expense',
    statusField: 'financeStatus',
    pendingValue: 'pending',
    approvedValue: 'approved',
    rejectedValue: 'rejected',
    completedValues: ['reimbursed'],
    ownerField: 'employee',
    approverRoles: ['Finance'],
    requiresTeamOwnership: false, // any Finance user may act on any expense
    getDisplayId: (doc) => doc.expenseNumber,
  },
};

const getConfig = (type) => {
  const config = APPROVAL_CONFIGS[type];
  if (!config) throw new AppError(`Unsupported approval type: ${type}`, 400);
  return config;
};

// ============================================================
// Shared helpers
// ============================================================

const loadEntity = async (type, id) => {
  const config = getConfig(type);
  const entity = await config.Model.findOne({ _id: id, isDeleted: false });
  if (!entity) throw new AppError(`${config.entityLabel} not found`, 404);
  return entity;
};

const isAdmin = (user) => (user.role?.name || '').toLowerCase() === 'admin';
const hasRole = (user, roleNames) => roleNames.map((r) => r.toLowerCase()).includes((user.role?.name || '').toLowerCase());

/**
 * Business rule: "Manager can approve Trip requests. Finance can approve
 * Expense requests. Admin can perform any approval." Plus: a Manager may
 * only act on trips belonging to their own direct reports.
 */
const assertApproverAuthorized = async (user, type, entity) => {
  const config = getConfig(type);
  if (isAdmin(user)) return;

  if (!hasRole(user, config.approverRoles)) {
    throw new AppError(`Role '${user.role?.name}' cannot perform approval actions on ${config.entityLabel} requests`, 403);
  }

  if (config.requiresTeamOwnership) {
    const owner = await User.findById(entity[config.ownerField]).select('manager');
    if (!owner || String(owner.manager) !== String(user._id)) {
      throw new AppError('You are not authorized to act on this request - it is not on your team', 403);
    }
  }
};

/**
 * Broader access check for read/comment actions: the request's owner, an
 * eligible approver, or an Admin.
 */
const assertCanAccessApproval = async (user, type, entity) => {
  const config = getConfig(type);
  if (String(entity[config.ownerField]) === String(user._id)) return;
  if (isAdmin(user)) return;

  if (hasRole(user, config.approverRoles)) {
    if (!config.requiresTeamOwnership) return;
    const owner = await User.findById(entity[config.ownerField]).select('manager');
    if (owner && String(owner.manager) === String(user._id)) return;
  }

  throw new AppError('You are not authorized to view this request', 403);
};

const assertIsPending = (type, entity, actionLabel) => {
  const config = getConfig(type);
  if (entity[config.statusField] !== config.pendingValue) {
    throw new AppError(`Cannot ${actionLabel} a ${config.entityLabel.toLowerCase()} that is already ${entity[config.statusField]}`, 400);
  }
};

/**
 * Writes an immutable audit trail entry for every approval action. Logging
 * failures are caught and logged, never thrown - an audit-log outage must
 * not be able to block the underlying approval decision.
 */
const logApprovalAction = async ({ actor, action, type, entity, oldValue, newValue, description }) => {
  try {
    await AuditLog.create({
      user: actor._id,
      action,
      entity: getConfig(type).entityLabel,
      entityId: entity._id,
      description,
      oldValue,
      newValue,
    });
  } catch (err) {
    console.error('[approvalService] Failed to write audit log:', err.message);
  }
};

/**
 * Notifies the request's owner about an approval decision, via the existing
 * NotificationService. Failures are logged, never thrown.
 */
const notifyOwner = async (type, entity, eventLabel, message) => {
  try {
    const config = getConfig(type);
    await notificationService.createNotification({
      receiver: entity[config.ownerField],
      title: `${config.entityLabel} ${eventLabel}`,
      message,
      priority: eventLabel === 'Approved' || eventLabel === 'Rejected' ? 'high' : 'medium',
      type: type === 'trip' ? 'approval' : 'finance',
      link: `/${type}s/${config.getDisplayId(entity)}`,
      relatedEntity: { entityType: config.entityLabel, entityId: entity._id },
    });
  } catch (err) {
    console.error(`[approvalService] Failed to notify owner of "${eventLabel}":`, err.message);
  }
};

/**
 * Applies the type-specific side effects of an approve/reject decision.
 * Trip records its own structured approvalWorkflow array; Expense records
 * a reviewer/timestamp pair. Both share an identical `comments` sub-schema,
 * which is where the generic engine records its own note either way.
 */
const applyDecisionSideEffects = (type, entity, actor, decision, comments) => {
  const config = getConfig(type);
  entity[config.statusField] = decision === 'approve' ? config.approvedValue : config.rejectedValue;

  if (type === 'trip') {
    entity.approvalWorkflow.push({
      approver: actor._id,
      level: entity.approvalWorkflow.length + 1,
      status: decision === 'approve' ? 'approved' : 'rejected',
      comments,
      actionedAt: new Date(),
    });
    if (decision === 'approve') entity.approvedAt = new Date();
    if (decision === 'reject') entity.rejectedAt = new Date();
  } else if (type === 'expense') {
    entity.financeReviewedBy = actor._id;
    entity.financeReviewedAt = new Date();
  }

  if (comments) entity.comments.push({ author: actor._id, message: comments });
};

// ============================================================
// Approval actions
// ============================================================

const approveRequest = async (user, type, id, { comments } = {}) => {
  const config = getConfig(type);
  const entity = await loadEntity(type, id);

  await assertApproverAuthorized(user, type, entity);
  assertIsPending(type, entity, 'approve');

  const previousStatus = entity[config.statusField];
  applyDecisionSideEffects(type, entity, user, 'approve', comments);
  await entity.save();

  await logApprovalAction({
    actor: user,
    action: `${type.toUpperCase()}_APPROVED`,
    type,
    entity,
    oldValue: { [config.statusField]: previousStatus },
    newValue: { [config.statusField]: entity[config.statusField] },
    description: comments,
  });

  await notifyOwner(type, entity, 'Approved', `Your ${config.entityLabel.toLowerCase()} (${config.getDisplayId(entity)}) has been approved.`);
  return entity;
};

/**
 * Business rule: "Rejected requests must store rejection reason." Enforced
 * both at the validator layer (required field) and again here defensively.
 */
const rejectRequest = async (user, type, id, { comments } = {}) => {
  if (!comments || !comments.trim()) throw new AppError('A rejection reason is required', 400);

  const config = getConfig(type);
  const entity = await loadEntity(type, id);

  await assertApproverAuthorized(user, type, entity);
  assertIsPending(type, entity, 'reject');

  const previousStatus = entity[config.statusField];
  applyDecisionSideEffects(type, entity, user, 'reject', comments);
  await entity.save();

  await logApprovalAction({
    actor: user,
    action: `${type.toUpperCase()}_REJECTED`,
    type,
    entity,
    oldValue: { [config.statusField]: previousStatus },
    newValue: { [config.statusField]: entity[config.statusField] },
    description: comments,
  });

  await notifyOwner(type, entity, 'Rejected', `Your ${config.entityLabel.toLowerCase()} (${config.getDisplayId(entity)}) has been rejected: ${comments}`);
  return entity;
};

/**
 * "Changes Requested" has no matching value in Trip.status or
 * Expense.financeStatus, so it does not mutate the entity's real status -
 * it's tracked purely through the audit trail and surfaced as a derived
 * logical status (see deriveLogicalStatus) until the requester resubmits
 * and an approver ultimately approves/rejects.
 */
const requestChanges = async (user, type, id, { comments }) => {
  const config = getConfig(type);
  const entity = await loadEntity(type, id);

  await assertApproverAuthorized(user, type, entity);
  assertIsPending(type, entity, 'request changes on');

  entity.comments.push({ author: user._id, message: `Changes requested: ${comments}` });
  await entity.save();

  await logApprovalAction({
    actor: user,
    action: `${type.toUpperCase()}_CHANGES_REQUESTED`,
    type,
    entity,
    description: comments,
  });

  await notifyOwner(
    type,
    entity,
    'Changes Requested',
    `Changes were requested on your ${config.entityLabel.toLowerCase()} (${config.getDisplayId(entity)}): ${comments}`
  );
  return entity;
};

const addApprovalComment = async (user, type, id, message) => {
  const config = getConfig(type);
  const entity = await loadEntity(type, id);
  await assertCanAccessApproval(user, type, entity);

  entity.comments.push({ author: user._id, message });
  await entity.save();

  await logApprovalAction({
    actor: user,
    action: `${type.toUpperCase()}_COMMENT_ADDED`,
    type,
    entity,
    description: message,
  });

  // Notify the owner whenever someone else (an approver) comments on their request.
  const isOwnerCommenting = String(entity[config.ownerField]) === String(user._id);
  if (!isOwnerCommenting) {
    await notifyOwner(type, entity, 'Comment Added', message);
  }

  return entity;
};

// ============================================================
// History & timeline
// ============================================================

/**
 * Derives a unified 5-state logical status (Pending / Approved / Rejected /
 * Changes Requested / Completed) from the entity's real status field plus
 * its audit trail, since "Changes Requested" isn't a real persisted value.
 */
const deriveLogicalStatus = (type, entity, logs) => {
  const config = getConfig(type);
  const real = entity[config.statusField];

  if (config.completedValues.includes(real)) return 'completed';
  if (real === config.approvedValue) return 'approved';
  if (real === config.rejectedValue) return 'rejected';

  const lastChangesRequestedLog = [...logs].reverse().find((l) => l.action.endsWith('_CHANGES_REQUESTED'));
  const lastDecisionLog = [...logs].reverse().find((l) => l.action.endsWith('_APPROVED') || l.action.endsWith('_REJECTED'));

  if (lastChangesRequestedLog && (!lastDecisionLog || lastChangesRequestedLog.createdAt > lastDecisionLog.createdAt)) {
    return 'changes_requested';
  }
  return 'pending';
};

const getApprovalHistory = async (user, type, id, { limit } = {}) => {
  const entity = await loadEntity(type, id);
  await assertCanAccessApproval(user, type, entity);

  const config = getConfig(type);
  const logs = await AuditLog.find({ entity: config.entityLabel, entityId: entity._id })
    .sort({ createdAt: 1 })
    .limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 200)))
    .populate('user', 'firstName lastName email');

  return logs;
};

const getApprovalTimeline = async (user, type, id) => {
  const entity = await loadEntity(type, id);
  await assertCanAccessApproval(user, type, entity);

  const config = getConfig(type);
  const logs = await AuditLog.find({ entity: config.entityLabel, entityId: entity._id })
    .sort({ createdAt: 1 })
    .populate('user', 'firstName lastName email');

  const steps = logs.map((log) => ({
    action: log.action,
    by: log.user,
    comments: log.description,
    at: log.createdAt,
  }));

  return {
    type,
    entityId: entity._id,
    displayId: config.getDisplayId(entity),
    currentStatus: deriveLogicalStatus(type, entity, logs),
    steps,
  };
};

module.exports = {
  approveRequest,
  rejectRequest,
  requestChanges,
  addApprovalComment,
  getApprovalHistory,
  getApprovalTimeline,
};
