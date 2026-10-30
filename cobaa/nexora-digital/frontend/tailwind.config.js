/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand surfaces (spec Section B)
        ink: {
          950: '#090911', // primary bg
          900: '#10101B', // secondary bg
          850: '#141421', // section bg
          800: '#191929', // card bg
          700: '#202035', // elevated card
        },
        neon: {
          DEFAULT: '#8B5CF6', // primary purple
          bright: '#A855F7',  // electric purple
          soft: '#C4B5FD',    // soft violet
        },
        cyanx: { DEFAULT: '#22D3EE' },
        ok: '#22C55E',
        warn: '#F59E0B',
        bad: '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(139,92,246,0.22)',
        'glow-sm': '0 0 14px rgba(139,92,246,0.14)',
        card: '0 8px 32px rgba(0,0,0,0.35)',
        'card-hover': '0 12px 40px rgba(139,92,246,0.18)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(rgba(139,92,246,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.045) 1px, transparent 1px)',
      },
      backgroundSize: { grid: '44px 44px' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
