const User = require('../models/User');
const Department = require('../models/Department');
const Role = require('../models/Role');
const CompanyPolicy = require('../models/CompanyPolicy');
const TravelPolicy = require('../models/TravelPolicy');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');

// ============================================================
// Shared helpers
// ============================================================

/**
 * Writes an immutable audit trail entry for every mutating admin action.
 * Logging failures are caught and logged, never thrown - an audit-log
 * outage must not be able to block the underlying admin action.
 */
const logAdminAction = async ({ actor, action, entity, entityId, oldValue, newValue, description }) => {
  try {
    await AuditLog.create({ user: actor._id, action, entity, entityId, oldValue, newValue, description });
  } catch (err) {
    console.error('[adminService] Failed to write audit log:', err.message);
  }
};

const buildPagination = ({ page, limit }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const buildSort = (sort, fallback = { createdAt: -1 }) =>
  sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : fallback;

const paginateResult = (total, pageNum, limitNum) => ({
  pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
});

// ============================================================
// Employee Management
// ============================================================

const getAllEmployees = async (queryParams) => {
  const { search, department, role, accountStatus, sort } = queryParams;
  const { pageNum, limitNum, skip } = buildPagination(queryParams);

  const filter = { isDeleted: false };
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const [employees, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name code')
      .populate('role', 'name slug')
      .sort(buildSort(sort))
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return { employees, ...paginateResult(total, pageNum, limitNum) };
};

const getEmployeeById = async (employeeId) => {
  const employee = await User.findOne({ _id: employeeId, isDeleted: false })
    .populate('department', 'name code')
    .populate('role', 'name slug permissions')
    .populate('manager', 'firstName lastName email');

  if (!employee) throw new AppError('Employee not found', 404);
  return employee;
};

const EDITABLE_EMPLOYEE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'designation',
  'department', 'role', 'manager', 'employmentType', 'workLocation', 'monthlyBudget',
];

const updateEmployee = async (admin, employeeId, payload) => {
  const employee = await User.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw new AppError('Employee not found', 404);

  const oldValue = {};
  const newValue = {};

  EDITABLE_EMPLOYEE_FIELDS.forEach((field) => {
    if (payload[field] === undefined) return;
    oldValue[field] = employee[field];
    employee[field] = payload[field];
    newValue[field] = payload[field];
  });

  await employee.save();
  await logAdminAction({
    actor: admin, action: 'USER_UPDATED', entity: 'User', entityId: employee._id, oldValue, newValue,
    description: `Employee ${employee.employeeId} updated`,
  });

  return employee;
};

const suspendEmployee = async (admin, employeeId, reason) => {
  const employee = await User.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.accountStatus === 'suspended') throw new AppError('Employee is already suspended', 400);

  const previousStatus = employee.accountStatus;
  employee.accountStatus = 'suspended';
  employee.suspendedReason = reason;
  employee.suspendedAt = new Date();
  employee.suspendedBy = admin._id;

  await employee.save();
  await logAdminAction({
    actor: admin, action: 'USER_SUSPENDED', entity: 'User', entityId: employee._id,
    oldValue: { accountStatus: previousStatus }, newValue: { accountStatus: 'suspended' }, description: reason,
  });

  return employee;
};

const activateEmployee = async (admin, employeeId) => {
  const employee = await User.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.accountStatus === 'active') throw new AppError('Employee is already active', 400);

  const previousStatus = employee.accountStatus;
  employee.accountStatus = 'active';
  employee.suspendedReason = undefined;
  employee.suspendedAt = undefined;
  employee.suspendedBy = undefined;

  await employee.save();
  await logAdminAction({
    actor: admin, action: 'USER_ACTIVATED', entity: 'User', entityId: employee._id,
    oldValue: { accountStatus: previousStatus }, newValue: { accountStatus: 'active' },
  });

  return employee;
};

const softDeleteEmployee = async (admin, employeeId) => {
  const employee = await User.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw new AppError('Employee not found', 404);

  employee.isDeleted = true;
  employee.deletedAt = new Date();
  employee.deletedBy = admin._id;
  employee.accountStatus = 'inactive';

  await employee.save({ validateBeforeSave: false });
  await logAdminAction({
    actor: admin, action: 'USER_DELETED', entity: 'User', entityId: employee._id,
    description: `Employee ${employee.employeeId} soft-deleted`,
  });

  return { message: `Employee ${employee.employeeId} was deleted` };
};

// ============================================================
// Department Management
// ============================================================

const listDepartments = async (queryParams) => {
  const { search, isActive, sort } = queryParams;
  const { pageNum, limitNum, skip } = buildPagination(queryParams);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];

  const [departments, total] = await Promise.all([
    Department.find(filter).populate('head', 'firstName lastName email').sort(buildSort(sort, { name: 1 })).skip(skip).limit(limitNum),
    Department.countDocuments(filter),
  ]);

  return { departments, ...paginateResult(total, pageNum, limitNum) };
};

const createDepartment = async (admin, payload) => {
  const department = await Department.create(payload);
  await logAdminAction({
    actor: admin, action: 'DEPARTMENT_CREATED', entity: 'Department', entityId: department._id, newValue: payload,
    description: `Department ${department.name} created`,
  });
  return department;
};

const updateDepartment = async (admin, departmentId, payload) => {
  const department = await Department.findById(departmentId);
  if (!department) throw new AppError('Department not found', 404);

  const oldValue = {};
  Object.keys(payload).forEach((key) => {
    oldValue[key] = department[key];
    department[key] = payload[key];
  });

  await department.save();
  await logAdminAction({
    actor: admin, action: 'DEPARTMENT_UPDATED', entity: 'Department', entityId: department._id, oldValue, newValue: payload,
  });

  return department;
};

/**
 * Soft delete: Department already has an `isActive` flag, so deletion is
 * deactivation rather than a new field - the record and its history
 * (employees, trips, audit logs referencing it) are preserved.
 */
const deleteDepartment = async (admin, departmentId) => {
  const department = await Department.findById(departmentId);
  if (!department) throw new AppError('Department not found', 404);

  department.isActive = false;
  await department.save({ validateBeforeSave: false });

  await logAdminAction({
    actor: admin, action: 'DEPARTMENT_DELETED', entity: 'Department', entityId: department._id,
    description: `Department ${department.name} deactivated`,
  });

  return { message: `Department ${department.name} was deleted` };
};

// ============================================================
// Role Management
// ============================================================

const listRoles = async (queryParams) => {
  const { search, isActive, sort } = queryParams;
  const { pageNum, limitNum, skip } = buildPagination(queryParams);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [roles, total] = await Promise.all([
    Role.find(filter).sort(buildSort(sort, { level: 1 })).skip(skip).limit(limitNum),
    Role.countDocuments(filter),
  ]);

  return { roles, ...paginateResult(total, pageNum, limitNum) };
};

const updateRolePermissions = async (admin, roleId, permissions) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError('Role not found', 404);

  const oldPermissions = [...role.permissions];
  role.permissions = [...new Set(permissions)];
  await role.save();

  await logAdminAction({
    actor: admin, action: 'ROLE_PERMISSIONS_UPDATED', entity: 'Role', entityId: role._id,
    oldValue: { permissions: oldPermissions }, newValue: { permissions: role.permissions },
    description: `Permissions updated for role ${role.name}`,
  });

  return role;
};

// ============================================================
// Company Policy
// ============================================================

const createCompanyPolicy = async (admin, payload) => {
  const policy = await CompanyPolicy.create({ ...payload, createdBy: admin._id });
  await logAdminAction({
    actor: admin, action: 'COMPANY_POLICY_CREATED', entity: 'CompanyPolicy', entityId: policy._id, newValue: payload,
    description: `Policy ${policy.policyName} created`,
  });
  return policy;
};

const updateCompanyPolicy = async (admin, policyId, payload) => {
  const policy = await CompanyPolicy.findById(policyId);
  if (!policy) throw new AppError('Company policy not found', 404);

  const oldValue = {};
  Object.keys(payload).forEach((key) => {
    oldValue[key] = policy[key];
    policy[key] = payload[key];
  });

  await policy.save();
  await logAdminAction({
    actor: admin, action: 'COMPANY_POLICY_UPDATED', entity: 'CompanyPolicy', entityId: policy._id, oldValue, newValue: payload,
  });

  return policy;
};

const deleteCompanyPolicy = async (admin, policyId) => {
  const policy = await CompanyPolicy.findById(policyId);
  if (!policy) throw new AppError('Company policy not found', 404);

  policy.isActive = false;
  await policy.save({ validateBeforeSave: false });

  await logAdminAction({
    actor: admin, action: 'COMPANY_POLICY_DELETED', entity: 'CompanyPolicy', entityId: policy._id,
    description: `Policy ${policy.policyName} deactivated`,
  });

  return { message: `Policy ${policy.policyName} was deleted` };
};

// ============================================================
// Travel Policy
// ============================================================

const createTravelPolicy = async (admin, payload) => {
  const policy = await TravelPolicy.create({ ...payload, createdBy: admin._id });
  await logAdminAction({
    actor: admin, action: 'TRAVEL_POLICY_CREATED', entity: 'TravelPolicy', entityId: policy._id, newValue: payload,
    description: `Travel policy ${policy.policyName} created`,
  });
  return policy;
};

const updateTravelPolicy = async (admin, policyId, payload) => {
  const policy = await TravelPolicy.findById(policyId);
  if (!policy) throw new AppError('Travel policy not found', 404);

  const oldValue = {};
  Object.keys(payload).forEach((key) => {
    oldValue[key] = policy[key];
    policy[key] = payload[key];
  });

  await policy.save();
  await logAdminAction({
    actor: admin, action: 'TRAVEL_POLICY_UPDATED', entity: 'TravelPolicy', entityId: policy._id, oldValue, newValue: payload,
  });

  return policy;
};

const deleteTravelPolicy = async (admin, policyId) => {
  const policy = await TravelPolicy.findById(policyId);
  if (!policy) throw new AppError('Travel policy not found', 404);

  policy.isActive = false;
  await policy.save({ validateBeforeSave: false });

  await logAdminAction({
    actor: admin, action: 'TRAVEL_POLICY_DELETED', entity: 'TravelPolicy', entityId: policy._id,
    description: `Travel policy ${policy.policyName} deactivated`,
  });

  return { message: `Travel policy ${policy.policyName} was deleted` };
};

// ============================================================
// Audit Logs (list + search + filter unified, as with every other list endpoint)
// ============================================================

const getAuditLogs = async (queryParams) => {
  const { search, user, entity, action, dateFrom, dateTo, sort } = queryParams;
  const { pageNum, limitNum, skip } = buildPagination(queryParams);

  const filter = {};
  if (user) filter.user = user;
  if (entity) filter.entity = entity;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (search) filter.description = { $regex: search, $options: 'i' };
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('user', 'firstName lastName email').sort(buildSort(sort)).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, ...paginateResult(total, pageNum, limitNum) };
};

// ============================================================
// Activity Logs (list + filter unified)
// ============================================================

const getActivityLogs = async (queryParams) => {
  const { search, user, activityType, dateFrom, dateTo, sort } = queryParams;
  const { pageNum, limitNum, skip } = buildPagination(queryParams);

  const filter = {};
  if (user) filter.user = user;
  if (activityType) filter.activityType = activityType;
  if (search) filter.description = { $regex: search, $options: 'i' };
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter).populate('user', 'firstName lastName email').sort(buildSort(sort)).skip(skip).limit(limitNum),
    ActivityLog.countDocuments(filter),
  ]);

  return { activities, ...paginateResult(total, pageNum, limitNum) };
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  suspendEmployee,
  activateEmployee,
  softDeleteEmployee,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listRoles,
  updateRolePermissions,
  createCompanyPolicy,
  updateCompanyPolicy,
  deleteCompanyPolicy,
  createTravelPolicy,
  updateTravelPolicy,
  deleteTravelPolicy,
  getAuditLogs,
  getActivityLogs,
};
