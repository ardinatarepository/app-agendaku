// API service functions

import api from './axios';

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getMe:         ()     => api.get('/auth/me'),
  updateProfile: (data) => api.post('/auth/profile', data),
  deleteAccount: ()     => api.delete('/auth/me'),
};

// ─── Tasks ────────────────────────────────────────────────────────────────
export const taskAPI = {
  getDashboard:  ()       => api.get('/tasks/dashboard'),
  getAll:        (params) => api.get('/tasks', { params }),
  getById:       (id)     => api.get(`/tasks/${id}`),
  create:        (data)   => api.post('/tasks', data),
  update:        (id, data) => api.put(`/tasks/${id}`, data),
  delete:        (id)     => api.delete(`/tasks/${id}`),
  createSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  toggleSubtask: (taskId, subtaskId) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
  deleteSubtask: (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

// ─── Categories ───────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll:  ()         => api.get('/categories'),
  create:  (data)     => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)       => api.delete(`/categories/${id}`),
};
