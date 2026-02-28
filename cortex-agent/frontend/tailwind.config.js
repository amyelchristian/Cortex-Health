/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: {
          main: '#EF4A4A',
          light: '#FEE2E2',
          dark: '#95161B',
          glow: 'rgba(239,86,86,0.2)',
        },
        warning: {
          main: '#F68E0B',
          light: '#FEF3C7',
          dark: '#82400E',
          glow: 'rgba(245,158,11,0.2)',
        },
        success: {
          main: '#109981',
          light: '#D1FAE5',
          dark: '#065F46',
          glow: 'rgba(19,165,129,0.2)',
        },
        info: {
          main: '#00DAAA',
          light: '#CCFFF0',
          dark: '#008A6E',
          glow: 'rgba(0,218,170,0.2)',
        },
        purple: {
          main: '#8B5CF6',
          light: '#EDE9FE',
          dark: '#5B21B6',
          glow: 'rgba(139,92,246,0.2)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
