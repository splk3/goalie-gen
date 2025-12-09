/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
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
