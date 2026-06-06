/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'om-bg': '#121214',      // Основной фон (антрацит)
        'om-surface': '#1C1C1E', // Карточки и панели
        'om-accent': '#E63946',  // Холодный красный (акцент)
        'om-white': '#F1FAEE',   // Основной текст
        'om-gray': '#A1A1AA',    // Вторичный текст
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}