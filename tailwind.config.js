/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06070b',
          900: '#0b0d14',
          850: '#10131d',
          800: '#151927',
          700: '#1f2437',
          600: '#2b314a',
          500: '#4a5272',
          400: '#7a83a6',
          300: '#a7aecb',
          200: '#d3d7ea',
        },
        brand: { 400: '#a18bff', 500: '#7c5cff', 600: '#6542f5' },
        neon: { 400: '#5eead4', 500: '#22d3ee' },
        easy: '#34d399',
        medium: '#fbbf24',
        hard: '#fb7185',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,.35), 0 10px 40px -10px rgba(124,92,255,.55)',
      },
      keyframes: {
        'pop-in': { '0%': { transform: 'scale(.6)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'pop-in': 'pop-in .35s cubic-bezier(.2,.9,.3,1.4)',
      },
    },
  },
  plugins: [],
};
