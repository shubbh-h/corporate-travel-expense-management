import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * The backend issues the access/refresh tokens as httpOnly cookies (see
 * server/config/cookieOptions.js), so the browser sends them automatically -
 * this client never reads or stores the tokens itself. `withCredentials` is
 * what makes the browser include those cookies on cross-origin requests to
 * the API (the backend's CORS config already whitelists this origin).
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Routes that must never trigger a refresh-and-retry themselves, or a bad
// login/refresh attempt would loop forever trying to "refresh" its way out.
const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/refresh', '/auth/register'];

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (error) => {
  pendingRequests.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isExcluded = config && AUTH_EXCLUDED_PATHS.some((path) => config.url?.includes(path));
    const isUnauthorized = response?.status === 401;

    if (!isUnauthorized || isExcluded || config._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // A refresh is already in flight - queue this request until it settles,
      // rather than firing a second concurrent refresh call.
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      })
        .then(() => api(config))
        .catch((err) => Promise.reject(err));
    }

    config._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh');
      resolvePendingRequests(null);
      return api(config);
    } catch (refreshError) {
      resolvePendingRequests(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
