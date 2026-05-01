/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        primary: '#e8e8e6',
        secondary: '#888888',
        accent: '#1dce8a',
        border: 'rgba(255,255,255,0.08)'
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      transitionDuration: {
        '150': '150ms',
      }
    },
  },
  plugins: [],
}