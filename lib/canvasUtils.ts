// Canvas 기반 스튜디오 씬 렌더링 + 3D 느낌 합성.
// 반드시 클라이언트('use client')에서만 호출해야 한다.

import type { Bokeh, Scene } from "./backgrounds";
import { getMood, type MoodKey } from "./backgrounds";

/* ------------------------------- 색상 유틸 ------------------------------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** 결정적 난수 (mulberry32) — 같은 시드 → 같은 배치 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ 노이즈 타일 ------------------------------ */

let cachedNoise: HTMLCanvasElement | null = null;
function getNoiseTile(): HTMLCanvasElement | null {
  if (cachedNoise) return cachedNoise;
  const size = 160;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  cachedNoise = c;
  return c;
}

/* ------------------------------ 씬 렌더링 ------------------------------- */

function drawBaseGradient(
  ctx: CanvasRenderingContext2D,
  base: Scene["base"],
  w: number,
  h: number
): void {
  const rad = (base.angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const cx = w / 2;
  const cy = h / 2;
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  for (const s of base.stops) g.addColorStop(s.offset, s.color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawBokeh(
  ctx: CanvasRenderingContext2D,
  spec: Bokeh,
  w: number,
  h: number,
  dark: boolean
): void {
  const rng = mulberry32(spec.seed);
  const maxDim = Math.max(w, h);
  ctx.save();
  ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
  for (let i = 0; i < spec.count; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.9;
    const r = (spec.sizeMin + (spec.sizeMax - spec.sizeMin) * rng()) * maxDim;
    const a = spec.maxAlpha * (0.4 + 0.6 * rng());
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(spec.color, a));
    g.addColorStop(0.7, rgba(spec.color, a * 0.35));
    g.addColorStop(1, rgba(spec.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderScene(ctx: CanvasRenderingContext2D, scene: Scene, w: number, h: number): void {
  drawBaseGradient(ctx, scene.base, w, h);

  const maxDim = Math.max(w, h);

  // 소프트 라이트 블룸
  if (scene.blooms) {
    for (const b of scene.blooms) {
      const R = b.radius * maxDim;
      const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, R);
      g.addColorStop(0, rgba(b.color, b.alpha));
      g.addColorStop(1, rgba(b.color, 0));
      ctx.save();
      ctx.globalCompositeOperation = scene.dark ? "lighter" : "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // 보케
  if (scene.bokeh) drawBokeh(ctx, scene.bokeh, w, h, scene.dark);

  // 필름 그레인
  if (scene.grain > 0) {
    const tile = getNoiseTile();
    if (tile) {
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = scene.grain;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
  }

  // 비네트
  if (scene.vignette > 0) {
    const g = ctx.createRadialGradient(
      w / 2,
      h * 0.45,
      Math.min(w, h) * 0.2,
      w / 2,
      h * 0.5,
      maxDim * 0.75
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${scene.vignette})`);
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/* --------------------------- 3D 느낌 피사체 합성 --------------------------- */

function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  objW: number,
  objH: number,
  dark: boolean
): void {
  const rx = objW * 0.52;
  const ry = Math.max(6, objH * 0.05);
  const core = dark ? 0.5 : 0.4;
  ctx.save();
  ctx.translate(cx, baseY - ry * 0.15);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${core})`);
  g.addColorStop(0.6, `rgba(0,0,0,${core * 0.4})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawReflection(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  objLeft: number,
  baseY: number,
  objW: number,
  objH: number,
  dark: boolean
): void {
  const rw = Math.max(1, Math.round(objW));
  const rh = Math.max(1, Math.round(objH));
  const rc = document.createElement("canvas");
  rc.width = rw;
  rc.height = rh;
  const r = rc.getContext("2d");
  if (!r) return;

  // 상하 반전
  r.translate(0, rh);
  r.scale(1, -1);
  r.drawImage(bmp, 0, 0, rw, rh);

  // 위(=피사체 밑동)로 갈수록 진하고 아래로 사라지게 마스킹
  r.globalCompositeOperation = "destination-in";
  const g = r.createLinearGradient(0, 0, 0, rh);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.45, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  r.fillStyle = g;
  r.fillRect(0, 0, rw, rh);

  ctx.save();
  ctx.globalAlpha = dark ? 0.12 : 0.2;
  ctx.drawImage(rc, objLeft, baseY, objW, objH);
  ctx.restore();
}

/** 피사체를 배경 위에 3D 느낌(접지 그림자·반사·방향 그림자)으로 그린다. */
function drawSubject(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  width: number,
  height: number,
  dark: boolean
): void {
  const maxW = width * 0.64;
  const maxH = height * 0.54;
  const scale = Math.min(maxW / bmp.width, maxH / bmp.height);
  const objW = bmp.width * scale;
  const objH = bmp.height * scale;
  const cx = width / 2;
  const baseY = height * 0.7;
  const objTop = baseY - objH;
  const objLeft = cx - objW / 2;

  drawContactShadow(ctx, cx, baseY, objW, objH, dark);
  drawReflection(ctx, bmp, objLeft, baseY, objW, objH, dark);

  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${dark ? 0.45 : 0.28})`;
  ctx.shadowBlur = Math.max(width, height) * 0.035;
  ctx.shadowOffsetX = width * 0.005;
  ctx.shadowOffsetY = height * 0.022;
  ctx.drawImage(bmp, objLeft, objTop, objW, objH);
  ctx.restore();
}

/** 배경 이미지를 캔버스에 cover-fit 으로 그린다. */
function coverDraw(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  width: number,
  height: number
): void {
  const scale = Math.max(width / bmp.width, height / bmp.height);
  const dw = bmp.width * scale;
  const dh = bmp.height * scale;
  ctx.drawImage(bmp, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

/** 배경 이미지의 평균 밝기(0~1) — 그림자/반사 강도 튜닝용. */
function averageLuminance(bmp: ImageBitmap): number {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const x = c.getContext("2d");
  if (!x) return 0.5;
  x.drawImage(bmp, 0, 0, 1, 1);
  const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export interface OutImage {
  id: string;
  blob: Blob;
  url: string;
  filename: string;
}

/** 배경 한 겹: 무드 씬 또는 (AI 등) 이미지 */
export type Background =
  | { type: "scene"; scene: Scene }
  | { type: "image"; bitmap: ImageBitmap };

/** 파일명에 쓸 수 있게 원본 이름을 정리 (확장자 제거 + 안전 문자). */
function safeName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";
}

/** 누끼(디코드된 비트맵) 1장을 배경 1겹 위에 3D 느낌으로 합성해 Blob 반환. */
async function composeOne(
  cutout: ImageBitmap,
  bg: Background,
  width: number,
  height: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 컨텍스트를 생성할 수 없습니다.");

  let dark: boolean;
  if (bg.type === "scene") {
    renderScene(ctx, bg.scene, width, height);
    dark = bg.scene.dark;
  } else {
    coverDraw(ctx, bg.bitmap, width, height);
    dark = averageLuminance(bg.bitmap) < 0.5;
  }

  drawSubject(ctx, cutout, width, height, dark);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지 생성에 실패했습니다."))),
      "image/png"
    );
  });
}

function toOut(id: string, blob: Blob, filename: string): OutImage {
  return { id, blob, url: URL.createObjectURL(blob), filename };
}

/** 단일 누끼 → 무드의 4개 스튜디오 씬(스타일 변형). */
export async function compositeAll(
  cutout: Blob,
  mood: MoodKey,
  width: number,
  height: number
): Promise<OutImage[]> {
  const { scenes } = getMood(mood);
  const bmp = await createImageBitmap(cutout);
  try {
    const results: OutImage[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const blob = await composeOne(bmp, { type: "scene", scene: scenes[i] }, width, height);
      results.push(toOut(scenes[i].id, blob, `${mood}_${width}x${height}_${i + 1}.png`));
    }
    return results;
  } finally {
    bmp.close();
  }
}

/** 단일 누끼 → AI 배경 이미지들(스타일 변형). */
export async function compositeOnImages(
  cutout: Blob,
  backgrounds: Blob[],
  width: number,
  height: number
): Promise<OutImage[]> {
  const bmp = await createImageBitmap(cutout);
  const bgBmps = await Promise.all(backgrounds.map((b) => createImageBitmap(b)));
  try {
    const results: OutImage[] = [];
    for (let i = 0; i < bgBmps.length; i++) {
      const blob = await composeOne(bmp, { type: "image", bitmap: bgBmps[i] }, width, height);
      results.push(toOut(`ai-${i + 1}`, blob, `ai_${width}x${height}_${i + 1}.png`));
    }
    return results;
  } finally {
    bmp.close();
    bgBmps.forEach((b) => b.close());
  }
}

export interface BatchItem {
  id: string;
  name: string;
  cutout: Blob;
}

/** 여러 누끼 → 각 1장씩 (무드 씬을 순환하며 배치). */
export async function compositeBatchScenes(
  items: BatchItem[],
  mood: MoodKey,
  width: number,
  height: number
): Promise<OutImage[]> {
  const { scenes } = getMood(mood);
  const results: OutImage[] = [];
  for (let i = 0; i < items.length; i++) {
    const bmp = await createImageBitmap(items[i].cutout);
    try {
      const scene = scenes[i % scenes.length];
      const blob = await composeOne(bmp, { type: "scene", scene }, width, height);
      const n = String(i + 1).padStart(2, "0");
      results.push(
        toOut(items[i].id, blob, `${n}_${safeName(items[i].name)}_${mood}_${width}x${height}.png`)
      );
    } finally {
      bmp.close();
    }
  }
  return results;
}

/** 여러 누끼 → 각 1장씩 (AI 배경 이미지를 순환하며 배치). */
export async function compositeBatchOnImages(
  items: BatchItem[],
  backgrounds: Blob[],
  width: number,
  height: number
): Promise<OutImage[]> {
  const bgBmps = await Promise.all(backgrounds.map((b) => createImageBitmap(b)));
  try {
    const results: OutImage[] = [];
    for (let i = 0; i < items.length; i++) {
      const bmp = await createImageBitmap(items[i].cutout);
      try {
        const bitmap = bgBmps[i % bgBmps.length];
        const blob = await composeOne(bmp, { type: "image", bitmap }, width, height);
        const n = String(i + 1).padStart(2, "0");
        results.push(
          toOut(items[i].id, blob, `${n}_${safeName(items[i].name)}_ai_${width}x${height}.png`)
        );
      } finally {
        bmp.close();
      }
    }
    return results;
  } finally {
    bgBmps.forEach((b) => b.close());
  }
}
