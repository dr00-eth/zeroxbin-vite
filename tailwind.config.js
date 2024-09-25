/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '2rem',
      },
      colors: {
        cyan: {
          400: '#00ffff',
          500: '#00e6e6',
        },
      },
    },
  },
  plugins: [],
}