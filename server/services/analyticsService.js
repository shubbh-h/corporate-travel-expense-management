const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');

const roundTo2 = (value) => Math.round((value || 0) * 100) / 100;

// ============================================================
// Admin Dashboard
// ============================================================

const getAdminDashboard = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      departmentsCount,
      tripsCount,
      expensesCount,
      pendingApprovals,
      completedApprovals,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, accountStatus: 'active' }),
      User.countDocuments({ isDeleted: false, accountStatus: { $ne: 'active' } }),
      Department.countDocuments({ isActive: true }),
      Trip.countDocuments({ isDeleted: false }),
      Expense.countDocuments({ isDeleted: false }),
      Trip.countDocuments({ isDeleted: false, status: 'pending' }),
      Trip.countDocuments({ isDeleted: false, status: { $in: ['approved', 'rejected', 'completed'] } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      departmentsCount,
      tripsCount,
      expensesCount,
      pendingApprovals,
      completedApprovals,
    };
  } catch (err) {
    throw new AppError(`Failed to load admin dashboard: ${err.message}`, 500);
  }
};

// ============================================================
// Trip Analytics
// ============================================================

const getTripAnalytics = async () => {
  try {
    const [tripsPerMonth, tripsPerDepartment, mostVisitedCities, averageTripCost, statusDistribution] = await Promise.all([
      Trip.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: { year: { $year: '$dates.startDate' }, month: { $month: '$dates.startDate' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { _id: 0, year: '$_id.year', month: '$_id.month', count: 1 } },
      ]),

      Trip.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, departmentId: '$_id', departmentName: '$department.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),

      Trip.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$destination', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, city: '$_id', count: 1 } },
      ]),

      Trip.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, avgCost: { $avg: '$budget.estimated' } } },
      ]),

      Trip.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
    ]);

    return {
      tripsPerMonth,
      tripsPerDepartment,
      mostVisitedCities,
      averageTripCost: roundTo2(averageTripCost[0]?.avgCost),
      tripStatusDistribution: statusDistribution,
    };
  } catch (err) {
    throw new AppError(`Failed to load trip analytics: ${err.message}`, 500);
  }
};

// ============================================================
// Expense Analytics
// ============================================================

const getExpenseAnalytics = async () => {
  try {
    const [statusCounts, amountTotals, categoryBreakdown, monthlyTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$financeStatus', count: { $sum: 1 } } },
      ]),

      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, avgAmount: { $avg: '$amountInBaseCurrency' }, count: { $sum: 1 } } },
      ]),

      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$amountInBaseCurrency' } } },
        { $project: { _id: 0, category: '$_id', count: 1, totalAmount: 1 } },
        { $sort: { totalAmount: -1 } },
      ]),

      Expense.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amountInBaseCurrency' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { _id: 0, year: '$_id.year', month: '$_id.month', count: 1, totalAmount: 1 } },
      ]),
    ]);

    const byStatus = statusCounts.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

    return {
      totalExpenses: amountTotals[0]?.count || 0,
      approvedExpenses: byStatus.approved || 0,
      pendingExpenses: byStatus.pending || 0,
      rejectedExpenses: byStatus.rejected || 0,
      reimbursedExpenses: byStatus.reimbursed || 0,
      averageExpenseAmount: roundTo2(amountTotals[0]?.avgAmount),
      expenseCategoryBreakdown: categoryBreakdown,
      monthlyExpenseTrend: monthlyTrend,
    };
  } catch (err) {
    throw new AppError(`Failed to load expense analytics: ${err.message}`, 500);
  }
};

module.exports = {
  getAdminDashboard,
  getTripAnalytics,
  getExpenseAnalytics,
};
