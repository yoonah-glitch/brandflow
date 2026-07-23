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
        // 포인트 컬러 = 뮤트 클레이
        brand: {
          DEFAULT: "#A9805C",
          dark: "#8A6547",
          soft: "#EFE6DA",
        },
        accent: {
          DEFAULT: "#A9805C",
          deep: "#8A6547",
          soft: "#EFE6DA",
        },
        bg: "#F3EEE4",
        paper: "#FCFAF5",
        ink: "#38322A",
        muted: "#877D6D",
        faint: "#B3A996",
        line: "#E8E1D3",
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
