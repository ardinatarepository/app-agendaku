// Design tokens AgendaKu Mobile - RESTORED ORIGINAL DEEP BLUE
export const COLORS = {
  primary:      '#0F172A', // Deep Navy / Slate (ASLI)
  primaryLight: '#E2E8F0',
  primaryDark:  '#020617',
  success:      '#059669', // Emerald
  successLight: '#ECFDF5',
  warning:      '#D97706', // Amber
  warningLight: '#FFFBEB',
  danger:       '#DC2626', // Red
  dangerLight:  '#FEF2F2',

  // Neutrals
  white:        '#ffffff',
  bg:           '#F8FAFC', // Very soft slate
  surface:      '#FFFFFF',
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',

  text:         '#0F172A',
  textMuted:    '#475569', 
  textLight:    '#94A3B8',
  textDisabled: '#CBD5E1',
};

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
};

export const FONT = {
  regular:   { fontFamily: 'Poppins_400Regular' },
  medium:    { fontFamily: 'Poppins_500Medium', fontWeight: '500' },
  semibold:  { fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
  bold:      { fontFamily: 'Poppins_700Bold', fontWeight: 'bold' },
  black:     { fontFamily: 'Poppins_900Black', fontWeight: '900' },
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const STATUS_CONFIG = {
  'BELUM_MULAI':       { label: 'Belum Mulai',       bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  'SEDANG_DIKERJAKAN': { label: 'Sedang Berjalan', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'SELESAI':           { label: 'Selesai',            bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  'TERLEWAT':          { label: 'Terlewat',          bg: '#FEF2F2', text: '#DC2626', dot: '#F87171' },
};

export const PRIORITY_CONFIG = {
  'RENDAH': { label: 'Rendah', bg: '#F1F5F9', text: '#475569' },
  'NORMAL': { label: 'Normal', bg: '#FFFBEB', text: '#B45309' },
  'TINGGI': { label: 'Tinggi', bg: '#FEF2F2', text: '#DC2626' },
};
