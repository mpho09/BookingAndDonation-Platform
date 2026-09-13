/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1EEE4",
        ink: "#1F3A3D",
        river: {
          DEFAULT: "#2C6E7F",
          dark: "#1F5563",
          light: "#DCEAEC",
        },
        gold: {
          DEFAULT: "#C98A2B",
          light: "#F4E3C4",
        },
        moss: "#5C7A52",
        clay: "#B24F3E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'Work Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
