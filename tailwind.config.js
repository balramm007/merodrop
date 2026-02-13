/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', 'Inter', 'Roboto', 'sans-serif'],
      },
      colors: {
        // PairDrop / Google Material Dark Theme
        bg: {
          light: '#f8f9fa',
          dark: '#000000', // Deep black/dark grey for the radar background
        },
        surface: {
          light: '#ffffff',
          dark: '#202124', // Card backgrounds
        },
        primary: '#4285f4', // Google Blue
        onPrimary: '#ffffff',
        text: {
          primary: '#e8eaed',
          secondary: '#9aa0a6',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s linear infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}