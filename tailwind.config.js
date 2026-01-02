/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'usa-red': '#BF0A30',
        'usa-blue': '#002868',
        'usa-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
