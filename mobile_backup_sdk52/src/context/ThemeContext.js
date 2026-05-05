import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

const LIGHT_COLORS = {
  primary:      '#1E466B',
  primaryLight: '#E3EDF7',
  bg:           '#FAFAFA',
  surface:      '#FFFFFF',
  text:         '#1E293B',
  textMuted:    '#64748B',
  textLight:    '#94A3B8',
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
  card:         '#FFFFFF',
};

const DARK_COLORS = {
  primary:      '#3B82F6',
  primaryLight: '#1E3A8A',
  bg:           '#0F172A',
  surface:      '#1E293B',
  text:         '#F8FAFC',
  textMuted:    '#94A3B8',
  textLight:    '#64748B',
  border:       '#334155',
  borderLight:  '#1E293B',
  card:         '#1E293B',
};
