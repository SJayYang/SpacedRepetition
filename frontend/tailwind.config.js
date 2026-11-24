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
          50: '#f0efff',
          100: '#e8e6ff',
          200: '#d7d3ff',
          300: '#b9b0ff',
          400: '#9688fb',
          500: '#7563ee',
          600: '#6149db',
          700: '#513bbb',
          800: '#42328f',
          900: '#332867',
        },
      },
    },
  },
  plugins: [],
}
