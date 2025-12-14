/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#8B2635',
          50: '#f9e8ea',
          100: '#f1c9ce',
          200: '#e5949e',
          300: '#d9606f',
          400: '#cd2b40',
          500: '#8B2635',
          600: '#6f1e2a',
          700: '#53171f',
          800: '#380f14',
          900: '#1c080a',
        },
        orange: {
          DEFAULT: '#ff6b35',
          light: '#ff8555',
          dark: '#ff5520',
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        'modal-appear': 'modalAppear 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        modalAppear: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
