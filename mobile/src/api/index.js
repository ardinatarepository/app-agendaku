// API service functions - Mobile

import api from './axios';

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getMe:         ()     => api.get('/auth/me'),
  updateProfile: (data) => api.post('/auth/profile', data),
  deleteAvatar:  () => api.delete('/auth/avatar'),
  changePassword: (data) => api.put('/auth/password', data),
  deleteAccount: () => api.delete('/auth/me'),
};

export const taskAPI = {
  getDashboard: ()         => api.get('/tasks/dashboard'),
  getAll:       (params)   => api.get('/tasks', { params }),
  getById:      (id)       => api.get(`/tasks/${id}`),
  create:       (data)     => api.post('/tasks', data),
  update:       (id, data) => api.put(`/tasks/${id}`, data),
  delete:       (id)       => api.delete(`/tasks/${id}`),
};

export const subtaskAPI = {
  create: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  toggle: (taskId, id)   => api.patch(`/tasks/${taskId}/subtasks/${id}/toggle`),
  delete: (taskId, id)   => api.delete(`/tasks/${taskId}/subtasks/${id}`),
};

export const categoryAPI = {
  getAll:  ()         => api.get('/categories'),
  create:  (data)     => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)       => api.delete(`/categories/${id}`),
};
