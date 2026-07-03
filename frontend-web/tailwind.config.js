/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FACC15', 50: '#FFFDF0', 100: '#FFFBE6', 200: '#FFF5B3', 300: '#FFE880', 400: '#FACC15', 500: '#E6C200', 600: '#B39700', 700: '#806C00' },
        accent: '#3B82F6', // Flat definition for better reliability
        'accent-light': '#EFF6FF',
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
        slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#475569', 600: '#334155', 700: '#1E293B', 800: '#0F172A', 900: '#020617' },
      },
      boxShadow: {
        'premium': '0 1px 2px rgba(0, 0, 0, 0.2)',
        'premium-hover': '0 8px 12px rgba(0, 0, 0, 0.3)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
};
