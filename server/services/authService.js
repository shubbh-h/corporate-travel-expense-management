const User = require('../models/User');
const Department = require('../models/Department');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { jwt: jwtConfig } = require('../config/env');
const { issueTokenPair, hashToken, generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CONCURRENT_SESSIONS = 5; // oldest refresh token is evicted beyond this

/**
 * Persists a newly issued refresh token on the user document, evicting the
 * oldest session if the concurrent-session cap is exceeded.
 */
const persistRefreshToken = async (user, tokenHash, expiresAt, meta) => {
  user.refreshTokens.push({
    token: tokenHash,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
    expiresAt,
  });

  if (user.refreshTokens.length > MAX_CONCURRENT_SESSIONS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_CONCURRENT_SESSIONS);
  }

  await user.save({ validateBeforeSave: false });
};

/**
 * Registers a new employee account.
 * Password hashing happens automatically in User's pre-save hook - never hash here.
 */
const registerUser = async (payload, meta) => {
  const { firstName, lastName, email, password, employeeId, designation, department, role, phone } = payload;

  const existing = await User.findOne({ $or: [{ email }, { employeeId }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'employee ID';
    throw new AppError(`An account with this ${field} already exists`, 409);
  }

  const [departmentDoc, roleDoc] = await Promise.all([
    Department.findById(department),
    Role.findById(role),
  ]);
  if (!departmentDoc) throw new AppError('Selected department does not exist', 400);
  if (!roleDoc) throw new AppError('Selected role does not exist', 400);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    employeeId,
    designation,
    department,
    role,
    phone,
    // Email verification / OTP flows are out of scope for this module, so new
    // accounts are activated immediately rather than left in "pending_verification".
    accountStatus: 'active',
  });

  const { accessToken, token: refreshToken, tokenHash, expiresAt } = issueTokenPair(user._id.toString());
  await persistRefreshToken(user, tokenHash, expiresAt, meta);

  const populated = await User.findById(user._id).populate('department', 'name code').populate('role', 'name slug permissions');

  return { user: populated, accessToken, refreshToken };
};

/**
 * Authenticates a user with email + password, enforcing account status and
 * a brute-force lockout after MAX_LOGIN_ATTEMPTS consecutive failures.
 */
const loginUser = async (payload, meta) => {
  const { email, password } = payload;

  const user = await User.findOne({ email })
    .select('+password +loginAttempts +lockUntil +refreshTokens')
    .populate('department', 'name code')
    .populate('role', 'name slug permissions');

  if (!user) throw new AppError('Invalid email or password', 401);

  if (user.isLocked) {
    throw new AppError('Account temporarily locked due to too many failed attempts. Try again later.', 423);
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('Your account has been suspended. Contact your administrator.', 403);
  }
  if (user.accountStatus === 'inactive') {
    throw new AppError('Your account is inactive. Contact your administrator.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid email or password', 401);
  }

  // Successful login: reset lockout counters, record session metadata.
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  user.lastLoginIP = meta?.ipAddress;

  const { accessToken, token: refreshToken, tokenHash, expiresAt } = issueTokenPair(user._id.toString());
  await persistRefreshToken(user, tokenHash, expiresAt, meta);

  return { user, accessToken, refreshToken };
};

/**
 * Logs a user out of the current session only, by removing the matching
 * refresh token hash. Other devices/sessions remain valid.
 */
const logoutUser = async (userId, refreshToken) => {
  if (!userId) return;

  const update = refreshToken
    ? { $pull: { refreshTokens: { token: hashToken(refreshToken) } } }
    : { $set: { refreshTokens: [] } }; // no token supplied -> clear all sessions defensively

  await User.findByIdAndUpdate(userId, update);
};

/**
 * Validates an incoming refresh token, rotates it (old one is invalidated,
 * a new one is issued), and returns a fresh token pair.
 */
const refreshAccessToken = async (refreshToken, meta) => {
  if (!refreshToken) throw new AppError('Refresh token is required', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token, please log in again', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) throw new AppError('User no longer exists', 401);

  const presentedHash = hashToken(refreshToken);
  const matchIndex = user.refreshTokens.findIndex((rt) => rt.token === presentedHash);

  if (matchIndex === -1) {
    // Token not found among stored sessions - either it was already rotated/used
    // once (replay attempt) or the sessions were cleared. Treat as a security
    // event and revoke every session for this user as a precaution.
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    throw new AppError('Refresh token reuse detected, all sessions revoked. Please log in again.', 401);
  }

  // Rotate: remove the old entry, issue and persist a brand new pair.
  user.refreshTokens.splice(matchIndex, 1);

  const newAccessToken = generateAccessToken(user._id.toString());
  const newRefresh = generateRefreshToken(user._id.toString());

  await persistRefreshToken(user, newRefresh.tokenHash, newRefresh.expiresAt, meta);

  return { accessToken: newAccessToken, refreshToken: newRefresh.token };
};

/**
 * Returns the currently authenticated user's profile.
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .populate('department', 'name code')
    .populate('role', 'name slug permissions')
    .populate('manager', 'firstName lastName email');

  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * Changes the current user's password after verifying the existing one.
 * All other active sessions are revoked so a stolen access token elsewhere
 * cannot be used to keep issuing new tokens after the password changes.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword; // re-hashed automatically by the pre-save hook
  user.refreshTokens = []; // force re-login on all other devices
  await user.save();

  return { message: 'Password changed successfully. Please log in again on your other devices.' };
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
};
