// API Client Mobile - Axios + AsyncStorage JWT

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../config';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Request interceptor: sisipkan token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('agendaku_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: hapus token jika 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['agendaku_token', 'agendaku_user']);
    }
    return Promise.reject(error);
  }
);

export default api;
