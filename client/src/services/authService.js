import api from './api';

/**
 * Every function here maps 1:1 to an existing backend route
 * (server/routes/authRoutes.js). Response bodies follow the backend's
 * standard { success, message, data } shape.
 */

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data.user;
};

export const logout = async () => {
  await api.post('/auth/logout');
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

export const refreshSession = async () => {
  const { data } = await api.post('/auth/refresh');
  return data.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.patch('/auth/change-password', { currentPassword, newPassword });
  return data.message;
};
