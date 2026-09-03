const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig } = require('../config/env');
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  parseDurationToMs,
} = require('../config/cookieOptions');

/**
 * Generates a short-lived access token used to authenticate ordinary API requests.
 */
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId, type: 'access' }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

/**
 * Generates a long-lived refresh token. Only its SHA-256 hash is persisted on the
 * User document (see User.refreshTokens) - the raw token itself is never stored,
 * so a database leak alone cannot be used to mint valid sessions.
 */
const generateRefreshToken = (userId) => {
  const token = jwt.sign({ id: userId, type: 'refresh', jti: crypto.randomUUID() }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn));

  return { token, tokenHash, expiresAt };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issues both tokens for a user in one call - used by register, login, and refresh.
 */
const issueTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refresh = generateRefreshToken(userId);
  return { accessToken, ...refresh };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  issueTokenPair,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
};
