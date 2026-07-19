// AI 배경 생성 클라이언트 헬퍼. 서버 라우트(/api/generate-bg)를 호출한다.

export async function generateAiBackgrounds(
  prompt: string,
  width: number,
  height: number
): Promise<Blob[]> {
  const res = await fetch("/api/generate-bg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!res.ok) {
    let msg = "AI 배경 생성에 실패했어요.";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }

  const j = (await res.json()) as { images?: string[] };
  const urls = j.images ?? [];
  if (urls.length === 0) throw new Error("생성된 배경이 없어요.");

  // data URL → Blob
  return Promise.all(urls.map(async (u) => (await fetch(u)).blob()));
}
