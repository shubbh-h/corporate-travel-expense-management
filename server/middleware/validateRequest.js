const { validationResult } = require('express-validator');

/**
 * Placed after a validator chain in a route definition. Collects any errors
 * added to the request by express-validator and short-circuits with a 422
 * before the request ever reaches the controller.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

module.exports = validateRequest;
