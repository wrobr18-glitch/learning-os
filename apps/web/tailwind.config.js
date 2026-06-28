const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Absolute paths using __dirname — works on both local and Vercel regardless of cwd
    path.resolve(__dirname, "src/pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "src/app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#020617",
          900: "#0f172a",
          850: "#182235", // Custom intermediate dark
          800: "#1e293b",
          700: "#334155"
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          50: "#ecfeff"
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  darkMode: "class"
};
