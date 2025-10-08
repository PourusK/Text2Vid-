import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#0b0c10",
        neon: "#00ff90",
        muted: "#9ba0a6",
      },
      boxShadow: {
        neon: "0 0 20px #00ff90",
      },
      fontFamily: {
        futurist: ["'Rajdhani'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
