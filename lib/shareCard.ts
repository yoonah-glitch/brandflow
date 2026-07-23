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

/**
 * 인스타 공유용 세로 카드 이미지를 만들어 PNG 다운로드한다.
 * 카카오 표지 이미지는 CORS 로 인해 canvas 가 오염될 수 있어,
 * 오염되면 표지 없이 텍스트 카드로 안전하게 대체한다.
 */
export async function downloadShareCard(book: ResultBook): Promise<void> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 배경 (은은한 보라 그라디언트)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#EEEDF9");
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 상단 브랜드 워드마크
  ctx.fillStyle = "#534AB7";
  ctx.font = "700 44px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Bookmatch", W / 2, 120);

  ctx.font = "500 30px -apple-system, sans-serif";
  ctx.fillStyle = "#6E64D6";
  ctx.fillText("나의 책 이상형", W / 2, 172);

  // 표지 이미지 (있으면)
  let coverTainted = false;
  const coverW = 380;
  const coverH = 540;
  const coverX = (W - coverW) / 2;
  const coverY = 230;
  if (book.cover) {
    const img = await loadImage(book.cover);
    if (img) {
      // 카드 뒤 그림자
      ctx.save();
      ctx.shadowColor = "rgba(83,74,183,0.25)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = "#fff";
      ctx.fillRect(coverX, coverY, coverW, coverH);
      ctx.restore();
      try {
        ctx.drawImage(img, coverX, coverY, coverW, coverH);
        // 오염 여부 미리 감지
        ctx.getImageData(coverX, coverY, 1, 1);
      } catch {
        coverTainted = true;
      }
    }
  }

  // 표지가 없거나 오염됐으면 자리표시 박스
  if (!book.cover || coverTainted) {
    ctx.fillStyle = "#534AB7";
    ctx.fillRect(coverX, coverY, coverW, coverH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 34px -apple-system, sans-serif";
    ctx.textAlign = "center";
    const titleLines = wrapText(ctx, book.title, coverW - 60).slice(0, 5);
    let ty = coverY + coverH / 2 - (titleLines.length - 1) * 24;
    for (const l of titleLines) {
      ctx.fillText(l, W / 2, ty);
      ty += 48;
    }
  }

  // 매치 퍼센트 배지
  ctx.fillStyle = "#534AB7";
  ctx.beginPath();
  ctx.arc(W / 2, coverY + coverH + 6, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 40px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${book.match}%`, W / 2, coverY + coverH + 20);

  // 제목 / 저자
  const textTop = coverY + coverH + 120;
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "700 48px -apple-system, sans-serif";
  const tLines = wrapText(ctx, book.title, W - 160).slice(0, 2);
  let yy = textTop;
  for (const l of tLines) {
    ctx.fillText(l, W / 2, yy);
    yy += 60;
  }
  ctx.font = "400 30px -apple-system, sans-serif";
  ctx.fillStyle = "#666";
  ctx.fillText(book.author, W / 2, yy + 4);

  // 추천 이유
  ctx.font = "400 30px -apple-system, sans-serif";
  ctx.fillStyle = "#444";
  const reasonLines = wrapText(ctx, book.reason, W - 200).slice(0, 4);
  let ry = yy + 74;
  for (const l of reasonLines) {
    ctx.fillText(l, W / 2, ry);
    ry += 44;
  }

  // 다운로드
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `bookmatch-${book.title.replace(/\s+/g, "_").slice(0, 20)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
