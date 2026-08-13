/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cc-navy':  '#0E1F39',
        'cc-gold':  '#FCAD0F',
        'cc-purple':'#91278E',
        'cc-green': '#8DC63F',
        'cc-mint':  '#D0DBD3',
        'cc-cream': '#FCF5F0',
      },
      fontFamily: {
        sans:   ['"Montserrat Arabic"', 'Roboto', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        mono:   ['"Fira Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
