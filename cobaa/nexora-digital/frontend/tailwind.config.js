/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#05070f', 900: '#0a0e1a', 800: '#101627', 700: '#182036' },
        neon: { DEFAULT: '#a855f7', soft: '#c084fc', deep: '#7c3aed' },
        cyanx: { DEFAULT: '#22d3ee' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(168,85,247,0.18)',
        'glow-sm': '0 0 12px rgba(168,85,247,0.12)',
      },
    },
  },
  plugins: [],
};
