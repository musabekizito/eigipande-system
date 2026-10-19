/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'eigipande-dark': '#0a3d6b',
        'eigipande-blue': '#0a4f8a',
      },
    },
  },
  plugins: [],
}