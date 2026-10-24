import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F5EF",
        surface: "#FFFEFB",
        "surface-secondary": "#F2EEE6",
        ink: {
          primary: "#202522",
          secondary: "#77766F",
          muted: "#98948A",
        },
        border: {
          subtle: "#E8E1D6",
          strong: "#D6CCC0",
        },
        champagne: {
          DEFAULT: "#B49A70",
          hover: "#947B53",
          light: "#EFE8DC",
          soft: "#F8F4EE",
        },
        status: {
          success: "#2E7D32",
          warning: "#ED6C02",
          error: "#C62828",
          info: "#0288D1",
        }
      },
      fontFamily: {
        serif: ["Instrument Serif", "Playfair Display", "Georgia", "serif"],
        sans: ["Geist Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(32, 37, 34, 0.04)",
        card: "0 2px 8px -2px rgba(32, 37, 34, 0.06), 0 1px 3px rgba(32, 37, 34, 0.03)",
        elevated: "0 10px 30px -5px rgba(32, 37, 34, 0.08)",
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      }
    },
  },
  plugins: [],
};

export default config;
