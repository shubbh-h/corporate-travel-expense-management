const AppError = require('../utils/AppError');

/**
 * Dynamic role authorization. Must run after `protect` (middleware/auth.js),
 * which populates req.user.role as a full Role document.
 *
 * Usage:
 *   router.get('/reports', protect, authorize('Admin', 'Finance'), controller.fn)
 *
 * Matching is case-insensitive against both the role's `name` and `slug`,
 * so `authorize('finance')` and `authorize('Finance Team')` both work as
 * long as they match how the role was seeded.
 */
const authorize = (...allowedRoles) => {
  const normalized = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return next(new AppError('Not authorized, no role assigned to this account', 403));
    }

    const roleName = (userRole.name || '').toLowerCase();
    const roleSlug = (userRole.slug || '').toLowerCase();

    const isAllowed = normalized.includes(roleName) || normalized.includes(roleSlug);
    if (!isAllowed) {
      return next(new AppError(`Role '${userRole.name}' is not permitted to perform this action`, 403));
    }

    next();
  };
};

module.exports = { authorize };
