const Trip = require('../models/Trip');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

const EDITABLE_STATUSES = ['draft', 'pending'];
const CANCELLABLE_STATUSES = ['draft', 'pending', 'approved'];

// ============================================================
// Shared helpers
// ============================================================

/**
 * Builds a Mongoose filter + sort + pagination options from a validated
 * query string, used by every "list trips" entry point (my trips, team
 * pending trips, admin all-trips) so filtering/searching/sorting/pagination
 * logic is written exactly once.
 */
const buildListOptions = (queryParams, baseFilter = {}) => {
  const { status, travelType, department, search, sort, dateFrom, dateTo, page, limit } = queryParams;

  const filter = { isDeleted: false, ...baseFilter };

  if (status) filter.status = status;
  if (travelType) filter.travelType = travelType;
  if (department) filter.department = department;

  if (dateFrom || dateTo) {
    filter['dates.startDate'] = {};
    if (dateFrom) filter['dates.startDate'].$gte = new Date(dateFrom);
    if (dateTo) filter['dates.startDate'].$lte = new Date(dateTo);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortObj = sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 };

  return { filter, sortObj, pageNum, limitNum, skip };
};

const paginate = async (filter, sortObj, skip, limitNum) => {
  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate('employee', 'firstName lastName employeeId email')
      .populate('department', 'name code')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Trip.countDocuments(filter),
  ]);

  return {
    trips,
    pagination: {
      total,
      page: skip / limitNum + 1,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Loads a trip and throws 404 if missing or already soft-deleted.
 */
const findActiveTripOrThrow = async (tripId) => {
  const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);
  return trip;
};

/**
 * Confirms the given manager is the direct manager of the trip's employee.
 * Enforces the "managers can approve only their team's trips" business rule.
 */
const assertManagerOwnsTrip = async (managerId, trip) => {
  const employee = await User.findById(trip.employee).select('manager');
  if (!employee || String(employee.manager) !== String(managerId)) {
    throw new AppError('You are not authorized to act on this trip - it is not on your team', 403);
  }
};

/**
 * Confirms the requesting user may view/comment on a trip: they are the
 * owner, the owner's direct manager, or an Admin.
 */
const assertCanAccessTrip = async (user, trip) => {
  const isOwner = String(trip.employee._id || trip.employee) === String(user._id);
  if (isOwner) return;

  const roleName = (user.role?.name || '').toLowerCase();
  if (roleName === 'admin') return;

  const employee = await User.findById(trip.employee).select('manager');
  const isManager = employee && String(employee.manager) === String(user._id);
  if (isManager) return;

  throw new AppError('You are not authorized to view this trip', 403);
};

// ============================================================
// Employee actions
// ============================================================

const createTrip = async (user, payload) => {
  const trip = await Trip.create({
    ...payload,
    employee: user._id,
    department: user.department,
    status: 'pending',
  });
  await notificationService.notifyTripEvent('created', trip);
  return trip;
};

const getMyTrips = async (userId, queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, { employee: userId });
  return paginate(filter, sortObj, skip, limitNum);
};

const getTripById = async (user, tripId) => {
  const trip = await Trip.findOne({ _id: tripId, isDeleted: false })
    .populate('employee', 'firstName lastName employeeId email manager')
    .populate('department', 'name code')
    .populate('approvalWorkflow.approver', 'firstName lastName email')
    .populate('comments.author', 'firstName lastName email');

  if (!trip) throw new AppError('Trip not found', 404);

  await assertCanAccessTrip(user, trip);
  return trip;
};

const updateTrip = async (user, tripId, payload) => {
  const trip = await findActiveTripOrThrow(tripId);

  if (String(trip.employee) !== String(user._id)) {
    throw new AppError('You can only edit your own trips', 403);
  }
  if (!EDITABLE_STATUSES.includes(trip.status)) {
    throw new AppError(`Cannot edit a trip that is already ${trip.status}`, 400);
  }

  const { origin, destination, travelType, purpose, dates, budget } = payload;
  if (origin) trip.origin = origin;
  if (destination) trip.destination = destination;
  if (travelType) trip.travelType = travelType;
  if (purpose) trip.purpose = purpose;
  if (dates?.startDate) trip.dates.startDate = dates.startDate;
  if (dates?.endDate) trip.dates.endDate = dates.endDate;
  if (budget?.estimated) trip.budget.estimated = budget.estimated;

  await trip.save();
  await notificationService.notifyTripEvent('updated', trip);
  return trip;
};

const cancelTrip = async (user, tripId, cancellationReason) => {
  const trip = await findActiveTripOrThrow(tripId);

  if (String(trip.employee) !== String(user._id)) {
    throw new AppError('You can only cancel your own trips', 403);
  }
  if (!CANCELLABLE_STATUSES.includes(trip.status)) {
    throw new AppError(`Cannot cancel a trip that is already ${trip.status}`, 400);
  }

  trip.status = 'cancelled';
  trip.cancelledAt = new Date();
  trip.cancellationReason = cancellationReason;
  await trip.save();
  await notificationService.notifyTripEvent('cancelled', trip);
  return trip;
};

// ============================================================
// Manager actions
// ============================================================

const getTeamPendingTrips = async (managerId, queryParams) => {
  const teamMemberIds = await User.find({ manager: managerId }).distinct('_id');
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams, {
    employee: { $in: teamMemberIds },
  });
  // This endpoint always shows pending trips only - a client-supplied status filter is ignored.
  filter.status = 'pending';
  return paginate(filter, sortObj, skip, limitNum);
};

const approveTrip = async (manager, tripId, { approvedBudget, comments }) => {
  const trip = await findActiveTripOrThrow(tripId);
  await assertManagerOwnsTrip(manager._id, trip);

  if (trip.status !== 'pending') {
    throw new AppError(`Cannot approve a trip that is already ${trip.status}`, 400);
  }

  trip.status = 'approved';
  trip.approvedAt = new Date();
  trip.budget.approved = approvedBudget ?? trip.budget.estimated;
  trip.approvalWorkflow.push({
    approver: manager._id,
    level: trip.approvalWorkflow.length + 1,
    status: 'approved',
    comments,
    actionedAt: new Date(),
  });

  await trip.save();
  await notificationService.notifyTripEvent('approved', trip);
  return trip;
};

const rejectTrip = async (manager, tripId, { comments }) => {
  const trip = await findActiveTripOrThrow(tripId);
  await assertManagerOwnsTrip(manager._id, trip);

  if (trip.status !== 'pending') {
    throw new AppError(`Cannot reject a trip that is already ${trip.status}`, 400);
  }

  trip.status = 'rejected';
  trip.rejectedAt = new Date();
  trip.approvalWorkflow.push({
    approver: manager._id,
    level: trip.approvalWorkflow.length + 1,
    status: 'rejected',
    comments,
    actionedAt: new Date(),
  });

  await trip.save();
  await notificationService.notifyTripEvent('rejected', trip);
  return trip;
};

const addTripComment = async (user, tripId, message) => {
  const trip = await findActiveTripOrThrow(tripId);
  await assertCanAccessTrip(user, trip);

  trip.comments.push({ author: user._id, message });
  await trip.save();
  return trip;
};

// ============================================================
// Admin actions
// ============================================================

const getAllTrips = async (queryParams) => {
  const { filter, sortObj, skip, limitNum } = buildListOptions(queryParams);
  return paginate(filter, sortObj, skip, limitNum);
};

const getTripStatistics = async () => {
  const [statusCounts, budgetAgg, travelTypeCounts] = await Promise.all([
    Trip.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Trip.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalEstimatedBudget: { $sum: '$budget.estimated' },
          totalApprovedBudget: { $sum: '$budget.approved' },
          avgEstimatedBudget: { $avg: '$budget.estimated' },
        },
      },
    ]),
    Trip.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$travelType', count: { $sum: 1 } } }]),
  ]);

  const byStatus = statusCounts.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
  const byTravelType = travelTypeCounts.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
  const totalTrips = statusCounts.reduce((sum, { count }) => sum + count, 0);

  return {
    totalTrips,
    byStatus,
    byTravelType,
    budget: budgetAgg[0]
      ? {
          totalEstimated: budgetAgg[0].totalEstimatedBudget || 0,
          totalApproved: budgetAgg[0].totalApprovedBudget || 0,
          averageEstimated: Math.round((budgetAgg[0].avgEstimatedBudget || 0) * 100) / 100,
        }
      : { totalEstimated: 0, totalApproved: 0, averageEstimated: 0 },
  };
};

const softDeleteTrip = async (admin, tripId) => {
  const trip = await findActiveTripOrThrow(tripId);

  trip.isDeleted = true;
  trip.deletedAt = new Date();
  trip.deletedBy = admin._id;
  await trip.save({ validateBeforeSave: false });

  return { message: `Trip ${trip.tripNumber} was deleted` };
};

module.exports = {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  cancelTrip,
  getTeamPendingTrips,
  approveTrip,
  rejectTrip,
  addTripComment,
  getAllTrips,
  getTripStatistics,
  softDeleteTrip,
};
