const asyncHandler = require('express-async-handler');
const adminService = require('../services/adminService');

// ---------- Employee Management ----------
const getAllEmployees = asyncHandler(async (req, res) => {
  const result = await adminService.getAllEmployees(req.query);
  res.status(200).json({ success: true, data: result });
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await adminService.getEmployeeById(req.params.id);
  res.status(200).json({ success: true, data: { employee } });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await adminService.updateEmployee(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Employee updated successfully', data: { employee } });
});

const suspendEmployee = asyncHandler(async (req, res) => {
  const employee = await adminService.suspendEmployee(req.user, req.params.id, req.body.reason);
  res.status(200).json({ success: true, message: 'Employee suspended successfully', data: { employee } });
});

const activateEmployee = asyncHandler(async (req, res) => {
  const employee = await adminService.activateEmployee(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Employee activated successfully', data: { employee } });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await adminService.softDeleteEmployee(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// ---------- Department Management ----------
const listDepartments = asyncHandler(async (req, res) => {
  const result = await adminService.listDepartments(req.query);
  res.status(200).json({ success: true, data: result });
});

const createDepartment = asyncHandler(async (req, res) => {
  const department = await adminService.createDepartment(req.user, req.body);
  res.status(201).json({ success: true, message: 'Department created successfully', data: { department } });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await adminService.updateDepartment(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Department updated successfully', data: { department } });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await adminService.deleteDepartment(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// ---------- Role Management ----------
const listRoles = asyncHandler(async (req, res) => {
  const result = await adminService.listRoles(req.query);
  res.status(200).json({ success: true, data: result });
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await adminService.updateRolePermissions(req.user, req.params.id, req.body.permissions);
  res.status(200).json({ success: true, message: 'Role permissions updated successfully', data: { role } });
});

// ---------- Company Policy ----------
const createCompanyPolicy = asyncHandler(async (req, res) => {
  const policy = await adminService.createCompanyPolicy(req.user, req.body);
  res.status(201).json({ success: true, message: 'Company policy created successfully', data: { policy } });
});

const updateCompanyPolicy = asyncHandler(async (req, res) => {
  const policy = await adminService.updateCompanyPolicy(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Company policy updated successfully', data: { policy } });
});

const deleteCompanyPolicy = asyncHandler(async (req, res) => {
  const result = await adminService.deleteCompanyPolicy(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// ---------- Travel Policy ----------
const createTravelPolicy = asyncHandler(async (req, res) => {
  const policy = await adminService.createTravelPolicy(req.user, req.body);
  res.status(201).json({ success: true, message: 'Travel policy created successfully', data: { policy } });
});

const updateTravelPolicy = asyncHandler(async (req, res) => {
  const policy = await adminService.updateTravelPolicy(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Travel policy updated successfully', data: { policy } });
});

const deleteTravelPolicy = asyncHandler(async (req, res) => {
  const result = await adminService.deleteTravelPolicy(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

// ---------- Audit Logs / Activity Logs ----------
const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getAuditLogs(req.query);
  res.status(200).json({ success: true, data: result });
});

const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getActivityLogs(req.query);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  suspendEmployee,
  activateEmployee,
  deleteEmployee,
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
