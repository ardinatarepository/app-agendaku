// Design tokens AgendaKu Mobile - LIGHT MODE REFINED
export const COLORS = {
  primary:      '#FFD700', // Gold Accent dikembalikan sesuai permintaan
  primaryLight: 'rgba(255, 215, 0, 0.1)',
  primaryDark:  '#B8860B',
  success:      '#10B981',
  successLight: '#ECFDF5',
  warning:      '#F59E0B',
  warningLight: '#FFFBEB',
  danger:       '#EF4444',
  dangerLight:  '#FEF2F2',

  // Neutrals (Light Mode)
  white:        '#ffffff',
  bg:           '#f5f5f0', // Kode warna spesifik dari user
  surface:      '#ffffff', // Kartu tetap putih agar kontras
  surfaceLight: '#f9fafb',
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',

  text:         '#1F2937', // Teks Gelap
  textMuted:    '#6B7280', 
  textLight:    '#9CA3AF',
  textDisabled: '#D1D5DB',
};

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
};

export const FONT = {
  regular:   { fontFamily: 'Poppins_400Regular' },
  medium:    { fontFamily: 'Poppins_500Medium' },
  semibold:  { fontFamily: 'Poppins_600SemiBold' },
  bold:      { fontFamily: 'Poppins_700Bold' },
  black:     { fontFamily: 'Poppins_900Black' },
  display:   { fontFamily: 'Inter_700Bold' },
  heading:   { fontFamily: 'ArchivoBlack_400Regular' },
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};

export const STATUS_CONFIG = {
  'BELUM_MULAI':       { label: 'Belum Mulai',       bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
  'SEDANG_DIKERJAKAN': { label: 'Berjalan',          bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' },
  'SELESAI':           { label: 'Selesai',           bg: '#ECFDF5', text: '#10B981', dot: '#10B981' },
  'TERLEWAT':          { label: 'Terlewat',          bg: '#FEE2E2', text: '#EF4444', dot: '#EF4444' },
};

export const PRIORITY_CONFIG = {
  'RENDAH': { label: 'Rendah', bg: '#F1F5F9', text: '#475569' },
  'NORMAL': { label: 'Normal', bg: 'rgba(128, 128, 128, 0.1)', text: '#808080' },
  'TINGGI': { label: 'Tinggi', bg: '#FEF2F2', text: '#DC2626' },
};
