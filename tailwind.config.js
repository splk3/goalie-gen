/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/templates/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'usa-red': '#AF272F',
        'usa-blue': '#00205B',
        'usa-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
