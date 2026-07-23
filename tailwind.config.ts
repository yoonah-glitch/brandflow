import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // 포인트 컬러 (보라)
        brand: {
          DEFAULT: "#534AB7",
          light: "#6E64D6",
          dark: "#413A94",
          soft: "#EEEDF9",
        },
        ink: "#1a1a1a",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
