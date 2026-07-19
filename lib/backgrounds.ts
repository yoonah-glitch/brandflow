// 무드별 "스튜디오 배경" 스펙.
// 단색/평면이 아니라 그라디언트 + 소프트 조명(bloom) + 보케(bokeh) + 그레인 + 비네트를
// 캔버스로 합성해 사진 같은 질감과 깊이를 만든다. (canvasUtils.renderScene 에서 렌더링)

export type MoodKey = "minimal" | "natural" | "dark" | "luxury" | "vivid";

export interface GradientStop {
  offset: number; // 0 ~ 1
  color: string;
}

/** 소프트 라이트 글로우 (위치·반경은 캔버스 비율 기준) */
export interface Bloom {
  x: number; // 0~1 (width 기준)
  y: number; // 0~1 (height 기준)
  radius: number; // 0~1 (max(w,h) 기준)
  color: string; // hex
  alpha: number; // 0~1
}

/** 보케(빛망울) — 흐린 원들을 흩뿌려 사진 같은 배경감 */
export interface Bokeh {
  count: number;
  color: string; // hex
  maxAlpha: number;
  sizeMin: number; // 0~1 (max(w,h) 기준)
  sizeMax: number;
  seed: number; // 결정적 배치를 위한 시드
}

export interface Scene {
  id: string;
  base: { angle: number; stops: GradientStop[] }; // 베이스 그라디언트
  blooms?: Bloom[];
  bokeh?: Bokeh;
  grain: number; // 0~1 (필름 그레인 강도)
  vignette: number; // 0~1 (가장자리 어둡게)
  dark: boolean; // 어두운 배경 여부 (합성 그림자/반사/조명 튜닝에 사용)
}

export interface Mood {
  key: MoodKey;
  label: string;
  description: string;
  swatch: string; // 무드 칩 대표 색
  scenes: Scene[]; // 4개
}

export const MOODS: Mood[] = [
  {
    key: "minimal",
    label: "미니멀",
    description: "오프화이트 스튜디오, 부드러운 상단광",
    swatch: "#F2F1EF",
    scenes: [
      {
        id: "minimal-1",
        base: { angle: 115, stops: [{ offset: 0, color: "#FBFAF8" }, { offset: 1, color: "#ECEAE6" }] },
        blooms: [{ x: 0.5, y: 0.28, radius: 0.7, color: "#FFFFFF", alpha: 0.5 }],
        grain: 0.05,
        vignette: 0.07,
        dark: false,
      },
      {
        id: "minimal-2",
        base: { angle: 160, stops: [{ offset: 0, color: "#F4F3F1" }, { offset: 1, color: "#E4E2DE" }] },
        blooms: [{ x: 0.32, y: 0.22, radius: 0.6, color: "#FFFFFF", alpha: 0.45 }],
        grain: 0.05,
        vignette: 0.08,
        dark: false,
      },
      {
        id: "minimal-3",
        base: { angle: 135, stops: [{ offset: 0, color: "#F7F5F1" }, { offset: 1, color: "#EAE7E1" }] },
        blooms: [{ x: 0.66, y: 0.3, radius: 0.62, color: "#FFF8EE", alpha: 0.4 }],
        grain: 0.045,
        vignette: 0.07,
        dark: false,
      },
      {
        id: "minimal-4",
        base: { angle: 100, stops: [{ offset: 0, color: "#F2F0EC" }, { offset: 1, color: "#DFDCD6" }] },
        blooms: [{ x: 0.5, y: 0.18, radius: 0.75, color: "#FFFFFF", alpha: 0.5 }],
        grain: 0.05,
        vignette: 0.1,
        dark: false,
      },
    ],
  },
  {
    key: "natural",
    label: "내추럴",
    description: "베이지·그린 톤, 따뜻한 자연광",
    swatch: "#CBD3BD",
    scenes: [
      {
        id: "natural-1",
        base: { angle: 125, stops: [{ offset: 0, color: "#F0E9DA" }, { offset: 1, color: "#D9DDCB" }] },
        blooms: [{ x: 0.28, y: 0.2, radius: 0.72, color: "#FFF3DC", alpha: 0.55 }],
        grain: 0.06,
        vignette: 0.12,
        dark: false,
      },
      {
        id: "natural-2",
        base: { angle: 150, stops: [{ offset: 0, color: "#E7E2D0" }, { offset: 1, color: "#C3CDB2" }] },
        blooms: [{ x: 0.72, y: 0.26, radius: 0.66, color: "#FBF1D8", alpha: 0.5 }],
        grain: 0.06,
        vignette: 0.13,
        dark: false,
      },
      {
        id: "natural-3",
        base: { angle: 110, stops: [{ offset: 0, color: "#EDE7D6" }, { offset: 1, color: "#CFD8C0" }] },
        blooms: [{ x: 0.5, y: 0.22, radius: 0.7, color: "#FFF6E2", alpha: 0.5 }],
        grain: 0.055,
        vignette: 0.12,
        dark: false,
      },
      {
        id: "natural-4",
        base: { angle: 165, stops: [{ offset: 0, color: "#E2E0CE" }, { offset: 1, color: "#B7C4A6" }] },
        blooms: [{ x: 0.34, y: 0.3, radius: 0.64, color: "#F3EAD2", alpha: 0.48 }],
        grain: 0.06,
        vignette: 0.14,
        dark: false,
      },
    ],
  },
  {
    key: "dark",
    label: "다크",
    description: "차콜 스튜디오, 스포트라이트 + 그레인",
    swatch: "#242424",
    scenes: [
      {
        id: "dark-1",
        base: { angle: 125, stops: [{ offset: 0, color: "#2B2B2D" }, { offset: 1, color: "#141416" }] },
        blooms: [{ x: 0.5, y: 0.36, radius: 0.62, color: "#6E6E76", alpha: 0.35 }],
        grain: 0.06,
        vignette: 0.4,
        dark: true,
      },
      {
        id: "dark-2",
        base: { angle: 150, stops: [{ offset: 0, color: "#33322F" }, { offset: 1, color: "#161513" }] },
        blooms: [{ x: 0.34, y: 0.3, radius: 0.6, color: "#7A756A", alpha: 0.32 }],
        grain: 0.06,
        vignette: 0.42,
        dark: true,
      },
      {
        id: "dark-3",
        base: { angle: 105, stops: [{ offset: 0, color: "#26292B" }, { offset: 1, color: "#111315" }] },
        blooms: [{ x: 0.66, y: 0.34, radius: 0.58, color: "#5F6B72", alpha: 0.34 }],
        grain: 0.055,
        vignette: 0.4,
        dark: true,
      },
      {
        id: "dark-4",
        base: { angle: 135, stops: [{ offset: 0, color: "#2E2E30" }, { offset: 0.6, color: "#1D1D1F" }, { offset: 1, color: "#0F0F11" }] },
        blooms: [{ x: 0.5, y: 0.3, radius: 0.7, color: "#71717A", alpha: 0.3 }],
        grain: 0.06,
        vignette: 0.46,
        dark: true,
      },
    ],
  },
  {
    key: "luxury",
    label: "럭셔리",
    description: "딥블랙 + 골드 보케, 림라이트",
    swatch: "#1b1305",
    scenes: [
      {
        id: "luxury-1",
        base: { angle: 145, stops: [{ offset: 0, color: "#0C0B09" }, { offset: 1, color: "#2E2413" }] },
        blooms: [{ x: 0.62, y: 0.32, radius: 0.6, color: "#C79A45", alpha: 0.3 }],
        bokeh: { count: 7, color: "#E4B45A", maxAlpha: 0.16, sizeMin: 0.04, sizeMax: 0.16, seed: 11 },
        grain: 0.05,
        vignette: 0.46,
        dark: true,
      },
      {
        id: "luxury-2",
        base: { angle: 120, stops: [{ offset: 0, color: "#141210" }, { offset: 0.65, color: "#3A2E17" }, { offset: 1, color: "#0A0A0A" }] },
        blooms: [{ x: 0.36, y: 0.28, radius: 0.58, color: "#D8A94E", alpha: 0.32 }],
        bokeh: { count: 9, color: "#EEC777", maxAlpha: 0.14, sizeMin: 0.03, sizeMax: 0.13, seed: 27 },
        grain: 0.05,
        vignette: 0.48,
        dark: true,
      },
      {
        id: "luxury-3",
        base: { angle: 180, stops: [{ offset: 0, color: "#1B160D" }, { offset: 1, color: "#09090A" }] },
        blooms: [{ x: 0.5, y: 0.24, radius: 0.66, color: "#C99A44", alpha: 0.26 }],
        bokeh: { count: 6, color: "#D9B25E", maxAlpha: 0.15, sizeMin: 0.05, sizeMax: 0.18, seed: 43 },
        grain: 0.045,
        vignette: 0.5,
        dark: true,
      },
      {
        id: "luxury-4",
        base: { angle: 135, stops: [{ offset: 0, color: "#0A0A0A" }, { offset: 0.55, color: "#2B2213" }, { offset: 1, color: "#7A5E28" }] },
        blooms: [{ x: 0.68, y: 0.36, radius: 0.56, color: "#F0CE82", alpha: 0.28 }],
        bokeh: { count: 8, color: "#EAC06B", maxAlpha: 0.13, sizeMin: 0.03, sizeMax: 0.12, seed: 59 },
        grain: 0.05,
        vignette: 0.46,
        dark: true,
      },
    ],
  },
  {
    key: "vivid",
    label: "비비드",
    description: "파스텔 그라디언트 + 컬러 보케",
    swatch: "#F7C6D9",
    scenes: [
      {
        id: "vivid-1",
        base: { angle: 135, stops: [{ offset: 0, color: "#FDE3EA" }, { offset: 1, color: "#F4B4CC" }] },
        bokeh: { count: 6, color: "#FFFFFF", maxAlpha: 0.28, sizeMin: 0.05, sizeMax: 0.16, seed: 7 },
        blooms: [{ x: 0.3, y: 0.24, radius: 0.6, color: "#FFF0F4", alpha: 0.5 }],
        grain: 0.04,
        vignette: 0.1,
        dark: false,
      },
      {
        id: "vivid-2",
        base: { angle: 130, stops: [{ offset: 0, color: "#DEEBFB" }, { offset: 1, color: "#A9C6F1" }] },
        bokeh: { count: 6, color: "#FFFFFF", maxAlpha: 0.3, sizeMin: 0.05, sizeMax: 0.17, seed: 19 },
        blooms: [{ x: 0.7, y: 0.26, radius: 0.6, color: "#EEF5FF", alpha: 0.5 }],
        grain: 0.04,
        vignette: 0.1,
        dark: false,
      },
      {
        id: "vivid-3",
        base: { angle: 140, stops: [{ offset: 0, color: "#E1F4E6" }, { offset: 1, color: "#A8DCBE" }] },
        bokeh: { count: 6, color: "#FFFFFF", maxAlpha: 0.28, sizeMin: 0.05, sizeMax: 0.16, seed: 31 },
        blooms: [{ x: 0.32, y: 0.28, radius: 0.6, color: "#F0FBF3", alpha: 0.5 }],
        grain: 0.04,
        vignette: 0.1,
        dark: false,
      },
      {
        id: "vivid-4",
        base: { angle: 135, stops: [{ offset: 0, color: "#FDEDD4" }, { offset: 1, color: "#F6C795" }] },
        bokeh: { count: 6, color: "#FFFFFF", maxAlpha: 0.28, sizeMin: 0.05, sizeMax: 0.16, seed: 53 },
        blooms: [{ x: 0.68, y: 0.26, radius: 0.6, color: "#FFF6E9", alpha: 0.5 }],
        grain: 0.04,
        vignette: 0.1,
        dark: false,
      },
    ],
  },
];

export function getMood(key: MoodKey): Mood {
  const mood = MOODS.find((m) => m.key === key);
  if (!mood) throw new Error(`알 수 없는 무드: ${key}`);
  return mood;
}
