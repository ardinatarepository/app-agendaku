/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#059669', 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857' },
        accent:   '#3B82F6', // Flat definition for better reliability
        'accent-light': '#EFF6FF',
        success:  '#059669',
        warning:  '#D97706',
        danger:   '#DC2626',
        slate:    { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#475569', 600: '#334155', 700: '#1E293B', 800: '#0F172A', 900: '#020617' },
      },
      boxShadow: {
        'premium': '0 4px 10px rgba(30, 30, 30, 0.12)',
        'premium-hover': '0 8px 20px rgba(30, 30, 30, 0.15)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in':  'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
};
