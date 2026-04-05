import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#000000",
          card: "#111111",
        },
        accent: {
          amber: "#F59E0B",
          orange: "#EA580C",
        },
        muted: {
          DEFAULT: "#888888",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glass-sm": "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      backgroundImage: {
        "glass-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
