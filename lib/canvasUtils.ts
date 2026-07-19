// Canvas API 기반 배경 그리기 + 누끼 이미지 합성 유틸.
// 반드시 클라이언트('use client')에서만 호출해야 한다.

import type { Background, RatioKey } from "./backgrounds";
import { getMood, getRatio } from "./backgrounds";
import type { MoodKey } from "./backgrounds";

/** 배경(솔리드/그라디언트)을 캔버스 전체에 그린다. */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: Background,
  width: number,
  height: number
): void {
  if (bg.type === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // 그라디언트: angle(deg)을 캔버스 중심을 지나는 선형 그라디언트로 변환
  const rad = (bg.angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const cx = width / 2;
  const cy = height / 2;
  const halfLen = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;

  const gradient = ctx.createLinearGradient(
    cx - dx * halfLen,
    cy - dy * halfLen,
    cx + dx * halfLen,
    cy + dy * halfLen
  );

  for (const stop of bg.stops) {
    gradient.addColorStop(stop.offset, stop.color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/** 누끼 이미지를 캔버스 중앙에 contain 방식으로 배치할 좌표/크기를 계산한다. */
function fitContain(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  padding: number
): { x: number; y: number; w: number; h: number } {
  const availW = boxW * (1 - padding * 2);
  const availH = boxH * (1 - padding * 2);
  const scale = Math.min(availW / imgW, availH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (boxW - w) / 2;
  const y = (boxH - h) / 2;
  return { x, y, w, h };
}

export interface CompositeResult {
  id: string;
  index: number;
  blob: Blob;
  url: string;
}

/**
 * 누끼 이미지(cutout)를 지정한 무드의 4개 배경에 합성해
 * 결과 Blob + objectURL 배열을 반환한다.
 */
export async function compositeAll(
  cutout: Blob,
  mood: MoodKey,
  ratioKey: RatioKey
): Promise<CompositeResult[]> {
  const { backgrounds } = getMood(mood);
  const { width, height } = getRatio(ratioKey);

  // 누끼 이미지를 한 번만 디코드
  const cutoutBitmap = await createImageBitmap(cutout);

  try {
    const results: CompositeResult[] = [];

    for (let i = 0; i < backgrounds.length; i++) {
      const bg = backgrounds[i];

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas 컨텍스트를 생성할 수 없습니다.");
      }

      // 1) 배경
      drawBackground(ctx, bg, width, height);

      // 2) 누끼 이미지 (중앙 정렬, 여백 12%)
      const { x, y, w, h } = fitContain(
        cutoutBitmap.width,
        cutoutBitmap.height,
        width,
        height,
        0.12
      );

      // 은은한 그림자로 입체감 부여
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
      ctx.shadowBlur = Math.round(width * 0.03);
      ctx.shadowOffsetY = Math.round(height * 0.012);
      ctx.drawImage(cutoutBitmap, x, y, w, h);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("이미지 생성에 실패했습니다."))),
          "image/png"
        );
      });

      results.push({
        id: bg.id,
        index: i + 1,
        blob,
        url: URL.createObjectURL(blob),
      });
    }

    return results;
  } finally {
    cutoutBitmap.close();
  }
}

/** 파일명 규칙: {mood}_{ratio}_{번호}.png (콜론은 파일명에 못 쓰므로 x 로 치환) */
export function buildFileName(mood: MoodKey, ratioKey: RatioKey, index: number): string {
  const ratioSlug = ratioKey.replace(":", "x");
  return `${mood}_${ratioSlug}_${index}.png`;
}
