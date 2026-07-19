// 무드별 배경 스펙 정의.
// 각 무드는 4개의 배경(솔리드 또는 그라디언트)을 가진다.

export type MoodKey = "minimal" | "natural" | "dark" | "luxury" | "vivid";

export type RatioKey = "1:1" | "4:5";

export interface GradientStop {
  offset: number; // 0 ~ 1
  color: string;
}

export interface SolidBackground {
  id: string;
  type: "solid";
  color: string;
}

export interface GradientBackground {
  id: string;
  type: "gradient";
  angle: number; // deg, 0 = 왼쪽→오른쪽
  stops: GradientStop[];
}

export type Background = SolidBackground | GradientBackground;

export interface Mood {
  key: MoodKey;
  label: string;
  description: string;
  swatch: string; // 무드 선택 칩에 표시할 대표 색
  backgrounds: Background[];
}

export const MOODS: Mood[] = [
  {
    key: "minimal",
    label: "미니멀",
    description: "오프화이트 톤의 깔끔한 배경",
    swatch: "#F2F1EF",
    backgrounds: [
      { id: "minimal-1", type: "solid", color: "#F8F7F5" },
      { id: "minimal-2", type: "solid", color: "#EDECEA" },
      { id: "minimal-3", type: "solid", color: "#F2F1EF" },
      { id: "minimal-4", type: "solid", color: "#E8E7E4" },
    ],
  },
  {
    key: "natural",
    label: "내추럴",
    description: "베이지·그린 계열의 따뜻한 배경",
    swatch: "#D8DCC9",
    backgrounds: [
      { id: "natural-1", type: "solid", color: "#EDE6D6" },
      {
        id: "natural-2",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#F1EAD9" },
          { offset: 1, color: "#DCE0CC" },
        ],
      },
      { id: "natural-3", type: "solid", color: "#D3DAC5" },
      {
        id: "natural-4",
        type: "gradient",
        angle: 160,
        stops: [
          { offset: 0, color: "#E4E7D5" },
          { offset: 1, color: "#B8C3A6" },
        ],
      },
    ],
  },
  {
    key: "dark",
    label: "다크",
    description: "다크그레이 톤의 시크한 배경",
    swatch: "#242422",
    backgrounds: [
      { id: "dark-1", type: "solid", color: "#1A1A1A" },
      { id: "dark-2", type: "solid", color: "#2C2C2C" },
      { id: "dark-3", type: "solid", color: "#242422" },
      { id: "dark-4", type: "solid", color: "#1E1E1E" },
    ],
  },
  {
    key: "luxury",
    label: "럭셔리",
    description: "딥블랙과 골드 톤의 고급스러운 배경",
    swatch: "#1a1206",
    backgrounds: [
      {
        id: "luxury-1",
        type: "gradient",
        angle: 145,
        stops: [
          { offset: 0, color: "#0B0B0B" },
          { offset: 1, color: "#3A2E16" },
        ],
      },
      {
        id: "luxury-2",
        type: "gradient",
        angle: 120,
        stops: [
          { offset: 0, color: "#141414" },
          { offset: 0.6, color: "#4A3A1C" },
          { offset: 1, color: "#C8A24B" },
        ],
      },
      {
        id: "luxury-3",
        type: "gradient",
        angle: 180,
        stops: [
          { offset: 0, color: "#1C1710" },
          { offset: 1, color: "#0A0A0A" },
        ],
      },
      {
        id: "luxury-4",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#0A0A0A" },
          { offset: 0.5, color: "#2E2415" },
          { offset: 1, color: "#8C6D2F" },
        ],
      },
    ],
  },
  {
    key: "vivid",
    label: "비비드",
    description: "파스텔 그라디언트의 생동감 있는 배경",
    swatch: "#F7C6D9",
    backgrounds: [
      {
        id: "vivid-1",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#FDE2E8" },
          { offset: 1, color: "#F6B7CC" },
        ],
      },
      {
        id: "vivid-2",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#DCEBFB" },
          { offset: 1, color: "#AFC9F2" },
        ],
      },
      {
        id: "vivid-3",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#DFF3E4" },
          { offset: 1, color: "#AEDCC0" },
        ],
      },
      {
        id: "vivid-4",
        type: "gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#FDEBD2" },
          { offset: 1, color: "#F7C79A" },
        ],
      },
    ],
  },
];

export function getMood(key: MoodKey): Mood {
  const mood = MOODS.find((m) => m.key === key);
  if (!mood) {
    throw new Error(`알 수 없는 무드: ${key}`);
  }
  return mood;
}

export const RATIOS: { key: RatioKey; label: string; width: number; height: number }[] = [
  { key: "1:1", label: "정사각형 1:1", width: 1080, height: 1080 },
  { key: "4:5", label: "세로형 4:5", width: 1080, height: 1350 },
];

export function getRatio(key: RatioKey) {
  const ratio = RATIOS.find((r) => r.key === key);
  if (!ratio) {
    throw new Error(`알 수 없는 비율: ${key}`);
  }
  return ratio;
}
