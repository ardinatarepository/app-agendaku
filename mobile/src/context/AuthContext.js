// AuthContext Mobile - AsyncStorage persistence

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // cek storage saat boot
  const [lastAvatar, setLastAvatar] = useState(null);

  // Baca dari AsyncStorage saat app pertama dibuka
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser, storedAvatar] = await AsyncStorage.multiGet([
          'agendaku_token', 
          'agendaku_user',
          'agendaku_last_avatar'
        ]);
        
        if (storedToken[1] && storedUser[1]) {
          setToken(storedToken[1]);
          setUser(JSON.parse(storedUser[1]));
        }
        if (storedAvatar[1]) {
          setLastAvatar(storedAvatar[1]);
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
    
    const storageItems = [
      ['agendaku_token', newToken],
      ['agendaku_user',  JSON.stringify(userData)],
    ];

    if (userData.avatar) {
      storageItems.push(['agendaku_last_avatar', userData.avatar]);
      setLastAvatar(userData.avatar);
    }

    await AsyncStorage.multiSet(storageItems);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    // JANGAN hapus agendaku_last_avatar di sini agar tetap tersimpan
    await AsyncStorage.multiRemove(['agendaku_token', 'agendaku_user']);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const userData = res.data.data.user;
      
      const storageItems = [['agendaku_user', JSON.stringify(userData)]];
      if (userData.avatar) {
        storageItems.push(['agendaku_last_avatar', userData.avatar]);
        setLastAvatar(userData.avatar);
      }

      await AsyncStorage.multiSet(storageItems);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, lastAvatar, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
