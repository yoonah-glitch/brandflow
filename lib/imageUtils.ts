// 이미지 파일 유효성 검사 + 리사이즈 유틸.
// Canvas API 를 사용하므로 반드시 클라이언트('use client')에서만 호출해야 한다.

export const MAX_IMAGE_SIZE = 2000;

/** 업로드된 파일이 이미지인지 검사한다. */
export function isImageFile(file: File): boolean {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

/**
 * 브라우저가 누끼 추출(WASM) + Canvas 합성을 지원하는지 확인한다.
 * 구형 브라우저 안내 메시지 노출에 사용.
 */
export function isBrowserSupported(): boolean {
  if (typeof window === "undefined") return true; // SSR 단계에서는 통과
  const hasCanvas = !!document.createElement("canvas").getContext?.("2d");
  const hasWasm = typeof WebAssembly === "object";
  const hasBitmap = typeof createImageBitmap === "function";
  const hasBlobUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  return hasCanvas && hasWasm && hasBitmap && hasBlobUrl;
}

/**
 * 이미지 파일을 최대 maxSize(px) 이내로 리사이즈해 PNG Blob 으로 반환한다.
 * 긴 변 기준으로 비율을 유지하며, 원본이 더 작으면 그대로 유지한다.
 */
export async function resizeImageFile(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  try {
    let { width, height } = bitmap;
    const longest = Math.max(width, height);

    if (longest > maxSize) {
      const scale = maxSize / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 컨텍스트를 생성할 수 없습니다.");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("이미지 리사이즈에 실패했습니다."));
        },
        "image/png"
      );
    });
  } finally {
    bitmap.close();
  }
}
