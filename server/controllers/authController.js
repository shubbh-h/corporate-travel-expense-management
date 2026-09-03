const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { setAuthCookies, clearAuthCookies } = require('../utils/generateTokens');

// Extracts request metadata (IP + user agent) used for session/audit tracking.
const getRequestMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body, getRequestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ success: true, message: 'Registration successful', data: { user, accessToken } });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body, getRequestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, message: 'Login successful', data: { user, accessToken } });
});

// @route POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logoutUser(req.user?._id, refreshToken);
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @route POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(incomingToken, getRequestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, message: 'Token refreshed', data: { accessToken } });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

// @route PATCH /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  clearAuthCookies(res); // current session's tokens were revoked by the service
  res.status(200).json({ success: true, message: result.message });
});

module.exports = { register, login, logout, refresh, getMe, changePassword };
