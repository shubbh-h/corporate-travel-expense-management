const { body } = require('express-validator');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .custom(isValidObjectId)
    .withMessage('Department must be a valid ID'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .custom(isValidObjectId)
    .withMessage('Role must be a valid ID'),
  body('phone').optional().trim(),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('New password must contain at least one letter')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from the current password'),
];

module.exports = { registerValidator, loginValidator, changePasswordValidator };
