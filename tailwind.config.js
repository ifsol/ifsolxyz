/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Pastikan mode gelap diaktifkan berdasarkan kelas
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};