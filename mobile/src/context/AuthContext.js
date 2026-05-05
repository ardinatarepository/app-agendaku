// AuthContext Mobile - AsyncStorage persistence

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // cek storage saat boot

  // Baca dari AsyncStorage saat app pertama dibuka
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser] = await AsyncStorage.multiGet(['agendaku_token', 'agendaku_user']);
        if (storedToken[1] && storedUser[1]) {
          setToken(storedToken[1]);
          setUser(JSON.parse(storedUser[1]));
        }
      } catch (_) {
        // abaikan error parsing
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: newToken } = res.data.data;
    await AsyncStorage.multiSet([
      ['agendaku_token', newToken],
      ['agendaku_user',  JSON.stringify(userData)],
    ]);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { user: userData, token: newToken } = res.data.data;
    await AsyncStorage.multiSet([
      ['agendaku_token', newToken],
      ['agendaku_user',  JSON.stringify(userData)],
    ]);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['agendaku_token', 'agendaku_user']);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const userData = res.data.data.user;
      await AsyncStorage.setItem('agendaku_user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
