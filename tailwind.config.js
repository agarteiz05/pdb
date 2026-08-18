/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          DEFAULT: "#FD6196",
          50: "#FBEAF0",
          800: "#72243E",
        },
        teal: {
          DEFAULT: "#1CA9B8",
          50: "#E1F5EE",
          800: "#085041",
        },
        mustard: "#E89339",
        cream: "#F5EAD6",
        ivory: "#FBF0DE",
        wine: "#8A2846",
        locked: "#8B8B88",
        ink: "#2B1B12",
      },
      fontFamily: {
        display: ["var(--font-prata)", "serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
