// AuthContext - State autentikasi global

import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agendaku_user');
      if (!saved) return null;
      let parsed = JSON.parse(saved);
      // Data Sanitization: Jika data terbungkus (bug sebelumnya), ambil isi dalamnya
      if (parsed && parsed.user && !parsed.name) {
        parsed = parsed.user;
        localStorage.setItem('agendaku_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('agendaku_token'));

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: newToken } = res.data.data;

    localStorage.setItem('agendaku_token', newToken);
    localStorage.setItem('agendaku_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    return res.data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agendaku_token');
    localStorage.removeItem('agendaku_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const userData = res.data.data.user;
      localStorage.setItem('agendaku_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Refresh user failed:', err);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await authAPI.deleteAccount();
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, refreshUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
