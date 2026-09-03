const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { jwt: jwtConfig } = require('../config/env');

/**
 * Verifies the access token (from the Authorization header or the httpOnly
 * cookie) and attaches the authenticated user to req.user. Role is populated
 * so downstream middleware (roles.js) can authorize by role name without an
 * extra database round trip.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Not authorized, invalid token';
    throw new AppError(message, 401);
  }

  const user = await User.findById(decoded.id).populate('role', 'name slug permissions').populate('department', 'name code');

  if (!user) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('Your account has been suspended. Contact your administrator.', 403);
  }
  if (user.accountStatus === 'inactive') {
    throw new AppError('Your account is inactive. Contact your administrator.', 403);
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    throw new AppError('Password was recently changed, please log in again', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
