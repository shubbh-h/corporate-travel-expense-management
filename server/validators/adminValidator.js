const { body, query, param } = require('express-validator');
const Role = require('../models/Role');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid ID')];

// ---------- Shared pagination/sort building blocks ----------
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ============================================================
// Employee Management
// ============================================================
const employeeListValidator = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 200 }),
  query('department').optional().isMongoId(),
  query('role').optional().isMongoId(),
  query('accountStatus').optional().isIn(['active', 'inactive', 'suspended', 'pending_verification']),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'firstName', '-firstName', 'employeeId', '-employeeId']),
];

const updateEmployeeValidator = [
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('email').optional().trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('phone').optional().trim(),
  body('designation').optional().trim().notEmpty().isLength({ max: 200 }),
  body('department').optional().isMongoId().withMessage('department must be a valid ID'),
  body('role').optional().isMongoId().withMessage('role must be a valid ID'),
  body('manager').optional({ nullable: true }).isMongoId().withMessage('manager must be a valid ID'),
  body('employmentType').optional().isIn(['full_time', 'part_time', 'contract', 'intern']),
  body('workLocation').optional().trim(),
  body('monthlyBudget').optional().isFloat({ min: 0 }),
];

const suspendEmployeeValidator = [
  body('reason').trim().notEmpty().withMessage('A suspension reason is required').isLength({ max: 500 }),
];

// ============================================================
// Department Management
// ============================================================
const departmentListValidator = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 200 }),
  query('isActive').optional().isBoolean(),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'name', '-name']),
];

const createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required').isLength({ max: 100 }),
  body('code').trim().notEmpty().withMessage('Department code is required').isLength({ min: 2, max: 10 }),
  body('costCenter').trim().notEmpty().withMessage('Cost center is required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('head').optional().isMongoId(),
  body('parentDepartment').optional({ nullable: true }).isMongoId(),
  body('budget.annual').optional().isFloat({ min: 0 }),
  body('budget.monthly').optional().isFloat({ min: 0 }),
  body('budget.currency').optional().trim().isLength({ min: 3, max: 3 }),
];

const updateDepartmentValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('head').optional({ nullable: true }).isMongoId(),
  body('parentDepartment').optional({ nullable: true }).isMongoId(),
  body('budget.annual').optional().isFloat({ min: 0 }),
  body('budget.monthly').optional().isFloat({ min: 0 }),
  body('budget.currency').optional().trim().isLength({ min: 3, max: 3 }),
];

// ============================================================
// Role Management
// ============================================================
const roleListValidator = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 200 }),
  query('isActive').optional().isBoolean(),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'name', '-name', 'level', '-level']),
];

const updateRolePermissionsValidator = [
  body('permissions').isArray().withMessage('permissions must be an array'),
  body('permissions.*')
    .isIn(Role.PERMISSIONS)
    .withMessage(`Each permission must be one of: ${Role.PERMISSIONS.join(', ')}`),
];

// ============================================================
// Company Policy
// ============================================================
const createCompanyPolicyValidator = [
  body('policyName').trim().notEmpty().withMessage('Policy name is required').isLength({ max: 150 }),
  body('policyCode').trim().notEmpty().withMessage('Policy code is required'),
  body('policyType').isIn(['travel', 'expense', 'reimbursement', 'leave', 'code_of_conduct', 'general']),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('effectiveDate').notEmpty().withMessage('Effective date is required').isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('isMandatory').optional().isBoolean(),
  body('applicableDepartments').optional().isArray(),
  body('applicableDepartments.*').optional().isMongoId(),
  body('applicableRoles').optional().isArray(),
  body('applicableRoles.*').optional().isMongoId(),
];

const updateCompanyPolicyValidator = [
  body('policyName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('policyType').optional().isIn(['travel', 'expense', 'reimbursement', 'leave', 'code_of_conduct', 'general']),
  body('description').optional().trim().notEmpty(),
  body('effectiveDate').optional().isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('isMandatory').optional().isBoolean(),
  body('applicableDepartments').optional().isArray(),
  body('applicableRoles').optional().isArray(),
];

// ============================================================
// Travel Policy
// ============================================================
const createTravelPolicyValidator = [
  body('policyName').trim().notEmpty().withMessage('Policy name is required').isLength({ max: 150 }),
  body('travelType').optional().isIn(['domestic', 'international', 'both']),
  body('maxTripBudget.amount').notEmpty().withMessage('maxTripBudget.amount is required').isFloat({ min: 0 }),
  body('maxTripBudget.currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('perDiem.amount').optional().isFloat({ min: 0 }),
  body('maxHotelBudgetPerNight.amount').optional().isFloat({ min: 0 }),
  body('advanceBookingDaysRequired').optional().isInt({ min: 0 }),
  body('maxTripDurationDays').optional().isInt({ min: 1 }),
  body('requiresVisaAssistance').optional().isBoolean(),
  body('requiresTravelInsurance').optional().isBoolean(),
  body('applicableDepartments').optional().isArray(),
  body('applicableRoles').optional().isArray(),
];

const updateTravelPolicyValidator = [
  body('policyName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('travelType').optional().isIn(['domestic', 'international', 'both']),
  body('maxTripBudget.amount').optional().isFloat({ min: 0 }),
  body('perDiem.amount').optional().isFloat({ min: 0 }),
  body('maxHotelBudgetPerNight.amount').optional().isFloat({ min: 0 }),
  body('advanceBookingDaysRequired').optional().isInt({ min: 0 }),
  body('maxTripDurationDays').optional().isInt({ min: 1 }),
  body('requiresVisaAssistance').optional().isBoolean(),
  body('requiresTravelInsurance').optional().isBoolean(),
];

// ============================================================
// Audit Logs / Activity Logs (list + search + filter, unified per resource)
// ============================================================
const auditLogListValidator = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 200 }),
  query('user').optional().isMongoId(),
  query('entity').optional().isIn(['User', 'Department', 'Role', 'Trip', 'Expense', 'Reimbursement', 'CompanyPolicy', 'TravelPolicy']),
  query('action').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sort').optional().isIn(['createdAt', '-createdAt']),
];

const activityLogListValidator = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 200 }),
  query('user').optional().isMongoId(),
  query('activityType').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sort').optional().isIn(['createdAt', '-createdAt']),
];

module.exports = {
  idParamValidator,
  employeeListValidator,
  updateEmployeeValidator,
  suspendEmployeeValidator,
  departmentListValidator,
  createDepartmentValidator,
  updateDepartmentValidator,
  roleListValidator,
  updateRolePermissionsValidator,
  createCompanyPolicyValidator,
  updateCompanyPolicyValidator,
  createTravelPolicyValidator,
  updateTravelPolicyValidator,
  auditLogListValidator,
  activityLogListValidator,
};
