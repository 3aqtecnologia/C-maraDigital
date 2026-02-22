/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef3fa',
          100: '#d5e4f5',
          200: '#adc8eb',
          300: '#80aada',
          400: '#5089c6',
          500: '#2d6ab4',
          600: '#1e3a5f',  // main brand
          700: '#182f4e',
          800: '#12233c',
          900: '#0c172a',
        },
        accent: {
          DEFAULT: '#c8a951', // ouro institucional
          light: '#e0c97a',
          dark: '#a68a30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
