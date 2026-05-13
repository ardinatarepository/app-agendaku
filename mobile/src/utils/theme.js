// Design tokens AgendaKu Mobile - Premium Dark Mode
export const COLORS = {
  primary:      '#3b82f6', // Vibrant Blue
  primaryLight: '#2563eb20',
  secondary:    '#8b5cf6', // Purple Accent
  
  // Dark Neutrals
  bg:           '#0f172a', // Obsidian / Navy Dark
  surface:      '#1e293b', // Deep Slate
  border:       '#334155', // Slate 700
  borderLight:  '#1e293b',
  
  // Status Colors (Vibrant)
  success:      '#10b981',
  warning:      '#f59e0b',
  danger:       '#ef4444',
  info:         '#0ea5e9',

  // Text Colors
  text:         '#f8fafc', // Slate 50
  textMuted:    '#94a3b8', // Slate 400
  textLight:    '#64748b', // Slate 500
  textDisabled: '#475569', // Slate 600
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const STATUS_CONFIG = {
  'BELUM_MULAI':        { label: 'Pending',    dot: '#94a3b8', bg: '#334155', text: '#94a3b8' },
  'SEDANG_DIKERJAKAN': { label: 'Berjalan',   dot: '#3b82f6', bg: '#2563eb30', text: '#60a5fa' },
  'SELESAI':           { label: 'Selesai',    dot: '#10b981', bg: '#05966930', text: '#34d399' },
};

export const PRIORITY_CONFIG = {
  'RENDAH': { label: 'Rendah', dot: '#94a3b8', text: '#94a3b8', bg: '#334155' },
  'NORMAL': { label: 'Normal', dot: '#3b82f6', text: '#60a5fa', bg: '#1e293b' },
  'TINGGI': { label: 'Tinggi', dot: '#ef4444', text: '#f87171', bg: '#450a0a' },
};
