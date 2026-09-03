const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
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
} = require('../validators/adminValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// Business rule: "Only Admin can access these routes" - applied once for the whole module.
router.use(protect, authorize('Admin'));

// ---------- Employee Management ----------
router.get('/employees', employeeListValidator, validateRequest, adminController.getAllEmployees);
router.get('/employees/:id', idParamValidator, validateRequest, adminController.getEmployeeById);
router.patch('/employees/:id', idParamValidator, updateEmployeeValidator, validateRequest, adminController.updateEmployee);
router.patch('/employees/:id/suspend', idParamValidator, suspendEmployeeValidator, validateRequest, adminController.suspendEmployee);
router.patch('/employees/:id/activate', idParamValidator, validateRequest, adminController.activateEmployee);
router.delete('/employees/:id', idParamValidator, validateRequest, adminController.deleteEmployee);

// ---------- Department Management ----------
router.get('/departments', departmentListValidator, validateRequest, adminController.listDepartments);
router.post('/departments', createDepartmentValidator, validateRequest, adminController.createDepartment);
router.patch('/departments/:id', idParamValidator, updateDepartmentValidator, validateRequest, adminController.updateDepartment);
router.delete('/departments/:id', idParamValidator, validateRequest, adminController.deleteDepartment);

// ---------- Role Management ----------
router.get('/roles', roleListValidator, validateRequest, adminController.listRoles);
router.patch('/roles/:id/permissions', idParamValidator, updateRolePermissionsValidator, validateRequest, adminController.updateRolePermissions);

// ---------- Company Policy ----------
router.post('/company-policies', createCompanyPolicyValidator, validateRequest, adminController.createCompanyPolicy);
router.patch('/company-policies/:id', idParamValidator, updateCompanyPolicyValidator, validateRequest, adminController.updateCompanyPolicy);
router.delete('/company-policies/:id', idParamValidator, validateRequest, adminController.deleteCompanyPolicy);

// ---------- Travel Policy ----------
router.post('/travel-policies', createTravelPolicyValidator, validateRequest, adminController.createTravelPolicy);
router.patch('/travel-policies/:id', idParamValidator, updateTravelPolicyValidator, validateRequest, adminController.updateTravelPolicy);
router.delete('/travel-policies/:id', idParamValidator, validateRequest, adminController.deleteTravelPolicy);

// ---------- Audit Logs / Activity Logs ----------
router.get('/audit-logs', auditLogListValidator, validateRequest, adminController.getAuditLogs);
router.get('/activity-logs', activityLogListValidator, validateRequest, adminController.getActivityLogs);

module.exports = router;
