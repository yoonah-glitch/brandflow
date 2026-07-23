import type { ResultBook } from "./types";

// 이미지를 CORS 허용으로 로드 (실패 시 null)
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// 긴 텍스트를 캔버스 폭에 맞게 줄바꿈
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 둥근 사각형 경로 (ctx.roundRect 미지원 환경 대비)
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// emotion(2줄)에서 짧은 요약 한 줄을 뽑는다.
function emotionSummary(emotion: string): string {
  const first =
    emotion
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)[0] || emotion.trim();
  return first.length > 24 ? first.slice(0, 23) + "…" : first;
}

/**
 * 공유용 세로 카드 이미지를 만들어 PNG 다운로드한다.
 * 베이지/크림 팔레트, 조용한 톤. 표지 이미지는 CORS 로 canvas 가
 * 오염될 수 있어, 오염되면 표지 없이 텍스트 카드로 안전하게 대체한다.
 *
 * 카드 문구: "나는 지금 '[감정 요약]' 상태래요 📚 / 다시, 책이 골라줬어요"
 */
export async function downloadShareCard(book: ResultBook): Promise<void> {
  const W = 1080;
  const H = 1350;
  const serif = "'Nanum Myeongjo', Georgia, serif";
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 배경 (은은한 베이지)
  ctx.fillStyle = "#F3EEE4";
  ctx.fillRect(0, 0, W, H);

  // 종이 패널 (솔리드 크림)
  ctx.fillStyle = "#FCFAF5";
  roundRectPath(ctx, 56, 56, W - 112, H - 112, 44);
  ctx.fill();
  ctx.strokeStyle = "#E8E1D3";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";

  // 브랜드 워드마크
  ctx.fillStyle = "#A9805C";
  ctx.font = `700 46px ${serif}`;
  ctx.fillText("다시, 책", W / 2, 168);

  ctx.fillStyle = "#B3A996";
  ctx.font = `400 26px ${serif}`;
  ctx.fillText("지친 당신이 다시 시작하는 곳", W / 2, 214);

  // 표지 이미지
  let coverTainted = false;
  const coverW = 320;
  const coverH = 458;
  const coverX = (W - coverW) / 2;
  const coverY = 268;
  if (book.cover) {
    const img = await loadImage(book.cover);
    if (img) {
      try {
        ctx.drawImage(img, coverX, coverY, coverW, coverH);
        ctx.getImageData(coverX, coverY, 1, 1); // 오염 감지
      } catch {
        coverTainted = true;
      }
    } else {
      coverTainted = true;
    }
  }

  // 표지가 없거나 오염됐으면 베이지 자리표시 박스
  if (!book.cover || coverTainted) {
    ctx.fillStyle = "#EFE6DA";
    roundRectPath(ctx, coverX, coverY, coverW, coverH, 10);
    ctx.fill();
    ctx.fillStyle = "#8A6547";
    ctx.font = `700 34px ${serif}`;
    const titleLines = wrapText(ctx, book.title, coverW - 56).slice(0, 5);
    let ty = coverY + coverH / 2 - (titleLines.length - 1) * 24;
    for (const l of titleLines) {
      ctx.fillText(l, W / 2, ty);
      ty += 48;
    }
  }

  // 제목 / 저자
  ctx.fillStyle = "#38322A";
  ctx.font = `700 46px ${serif}`;
  const tLines = wrapText(ctx, book.title, W - 200).slice(0, 2);
  let yy = coverY + coverH + 76;
  for (const l of tLines) {
    ctx.fillText(l, W / 2, yy);
    yy += 58;
  }
  ctx.font = `400 28px ${serif}`;
  ctx.fillStyle = "#877D6D";
  ctx.fillText(book.author, W / 2, yy + 2);

  // 하단 문구 (2줄)
  const caption1 = `나는 지금 '${emotionSummary(book.emotion)}' 상태래요 📚`;
  ctx.font = `400 34px ${serif}`;
  ctx.fillStyle = "#38322A";
  const cLines = wrapText(ctx, caption1, W - 220).slice(0, 2);
  let cy = H - 220;
  for (const l of cLines) {
    ctx.fillText(l, W / 2, cy);
    cy += 46;
  }
  ctx.font = `700 32px ${serif}`;
  ctx.fillStyle = "#A9805C";
  ctx.fillText("다시, 책이 골라줬어요", W / 2, cy + 14);

  // 다운로드
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `dasi-book-${book.title.replace(/\s+/g, "_").slice(0, 20)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
