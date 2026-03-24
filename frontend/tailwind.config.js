/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0d0d0d',
        primary: '#ffffff',
        secondary: '#666666',
        accent: '#00d4aa',
        border: '#1a1a1a'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      transitionDuration: {
        '150': '150ms',
      }
    },
  },
  plugins: [],
}