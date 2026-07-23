import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 명조(세리프) 계열을 기본으로 — 기기의 한국어 명조 우선
        sans: [
          "Nanum Myeongjo",
          "Gowun Batang",
          "AppleMyungjo",
          "Batang",
          "Georgia",
          "serif",
        ],
        serif: [
          "Nanum Myeongjo",
          "Gowun Batang",
          "AppleMyungjo",
          "Batang",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        // 따뜻한 코랄 포인트 컬러
        brand: {
          DEFAULT: "#E8674A",
          light: "#F2915E",
          dark: "#C1462C",
          soft: "#FCE7DB",
          tint: "#FDF6EF",
        },
        ink: "#2E2620",
        app: "#FFFDFB",
        muted: "#877567",
        faint: "#B8A697",
        line: {
          DEFAULT: "#F1E6D9",
          2: "#EBDDCC",
        },
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
