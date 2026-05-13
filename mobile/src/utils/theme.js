// Design tokens AgendaKu Mobile - RESTORED LIGHT THEME
export const COLORS = {
  primary:      '#3b82f6',
  primaryLight: '#eff6ff',
  secondary:    '#64748b',
  bg:           '#f8fafc',
  surface:      '#ffffff',
  border:       '#e2e8f0',
  borderLight:  '#f1f5f9',
  success:      '#10b981',
  warning:      '#f59e0b',
  danger:       '#ef4444',
  info:         '#0ea5e9',
  text:         '#1e293b',
  textMuted:    '#64748b',
  textLight:    '#94a3b8',
  textDisabled: '#cbd5e1',
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT = {
  regular:  { fontFamily: 'Poppins_400Regular' },
  medium:   { fontFamily: 'Poppins_500Medium' },
  semibold: { fontFamily: 'Poppins_600SemiBold' },
  bold:     { fontFamily: 'Poppins_700Bold' },
  black:    { fontFamily: 'Poppins_900Black' },
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const STATUS_CONFIG = {
  'BELUM_MULAI':        { label: 'Belum Mulai', dot: '#94a3b8', bg: '#f1f5f9', text: '#64748b' },
  'SEDANG_DIKERJAKAN': { label: 'Sedang Berjalan', dot: '#3b82f6', bg: '#eff6ff', text: '#3b82f6' },
  'SELESAI':           { label: 'Selesai', dot: '#10b981', bg: '#ecfdf5', text: '#10b981' },
};

export const PRIORITY_CONFIG = {
  'RENDAH': { label: 'Rendah', dot: '#94a3b8', text: '#64748b', bg: '#f1f5f9' },
  'NORMAL': { label: 'Normal', dot: '#3b82f6', text: '#3b82f6', bg: '#eff6ff' },
  'TINGGI': { label: 'Tinggi', dot: '#ef4444', text: '#ef4444', bg: '#fef2f2' },
};
