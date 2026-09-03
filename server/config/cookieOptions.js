const { env, jwt: jwtConfig } = require('./env');

/**
 * Parses simple duration strings used in JWT env vars ("15m", "7d", "1h", "30s")
 * into milliseconds, so cookie maxAge always stays in sync with token expiry
 * without having to hardcode the number twice.
 */
const parseDurationToMs = (duration) => {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(String(duration).trim());
  if (!match) return 15 * 60 * 1000; // sane fallback: 15 minutes

  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[match[2].toLowerCase()];
};

const isProd = env === 'production';

/**
 * Access token cookie: short-lived, sent with every request.
 */
const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: parseDurationToMs(jwtConfig.expiresIn),
  path: '/',
});

/**
 * Refresh token cookie: long-lived, scoped only to the refresh endpoint so it
 * is never sent on ordinary API calls, minimizing exposure of the credential.
 */
const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: parseDurationToMs(jwtConfig.refreshExpiresIn),
  path: '/api/auth/refresh',
});

module.exports = { parseDurationToMs, getAccessTokenCookieOptions, getRefreshTokenCookieOptions };
