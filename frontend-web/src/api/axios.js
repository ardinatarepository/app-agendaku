// API Client - Axios dengan JWT interceptor otomatis

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor: sisipkan token JWT di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agendaku_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: tangani 401 (token expired / tidak valid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agendaku_token');
      localStorage.removeItem('agendaku_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
