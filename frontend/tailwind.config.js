/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF7',
          100: '#FAF7F0',
          200: '#F3EEDF',
          300: '#E7DFCA',
          400: '#D5C7A9',
        },
        forest: {
          50: '#F0F7F4',
          100: '#D8EDE3',
          200: '#B2DCC9',
          300: '#7EBF9E',
          400: '#4FA077',
          500: '#2D8158',
          600: '#1F6744',
          700: '#1B5238',
          800: '#18422F',
          900: '#143627',
          950: '#0A1E16',
        },
        terracotta: {
          50: '#FDF5F2',
          100: '#FCE7DF',
          500: '#D95D39',
          600: '#C24B27',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(27, 82, 56, 0.06)',
        'premium': '0 12px 36px -4px rgba(27, 82, 56, 0.12)',
        'elevated': '0 20px 48px -8px rgba(27, 82, 56, 0.16)',
      }
    },
  },
  plugins: [],
}
