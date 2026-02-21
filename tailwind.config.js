/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.1)",
        glassBorder: "rgba(255, 255, 255, 0.2)",
        brand: {
          bg: "#BED3C3",      // Vert pastel
          text: "#212E53",    // Bleu marine
          coral: "#CE6A6B",   // Corail
          peach: "#EBACA2",   // Pêche
          teal: "#4A919E",    // Bleu sarcelle
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}