// 업로드 대상별 사이즈 프리셋 + 커스텀 사이즈 지원.

export interface SizePreset {
  key: string;
  group: string;
  label: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  // Instagram
  { key: "ig-square", group: "Instagram", label: "피드 정사각형 · 1:1", width: 1080, height: 1080 },
  { key: "ig-portrait", group: "Instagram", label: "피드 세로형 · 4:5", width: 1080, height: 1350 },
  { key: "ig-story", group: "Instagram", label: "스토리·릴스 · 9:16", width: 1080, height: 1920 },
  // Facebook
  { key: "fb-post", group: "Facebook", label: "피드 · 1.91:1", width: 1200, height: 630 },
  // X (Twitter)
  { key: "x-post", group: "X (트위터)", label: "가로 · 16:9", width: 1600, height: 900 },
  // YouTube
  { key: "yt-thumb", group: "YouTube", label: "썸네일 · 16:9", width: 1280, height: 720 },
  // Pinterest
  { key: "pin", group: "Pinterest", label: "핀 · 2:3", width: 1000, height: 1500 },
  // 기타
  { key: "web-wide", group: "기타", label: "와이드 · 3:2", width: 1500, height: 1000 },
];

export const MIN_DIMENSION = 200;
export const MAX_DIMENSION = 4096;

export function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return MIN_DIMENSION;
  return Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, Math.round(value)));
}

/** 현재 width/height 와 일치하는 프리셋 키를 찾는다 (없으면 커스텀). */
export function matchPresetKey(width: number, height: number): string | null {
  const p = SIZE_PRESETS.find((s) => s.width === width && s.height === height);
  return p ? p.key : null;
}

export interface SizeState {
  width: number;
  height: number;
}

export const DEFAULT_SIZE: SizeState = { width: 1080, height: 1080 };
