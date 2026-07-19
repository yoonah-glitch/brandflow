import { NextResponse } from "next/server";

// AI 배경 생성 라우트 (서버 전용). OPENAI_API_KEY 로 gpt-image-1 호출.
// 키는 서버 환경변수에만 두고 브라우저로 노출하지 않는다.

export const runtime = "nodejs";
export const maxDuration = 60; // 이미지 생성은 오래 걸릴 수 있음 (Vercel)

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_COUNT = 4;

type OpenAiSize = "1024x1024" | "1536x1024" | "1024x1536";

function pickSize(width: number, height: number): OpenAiSize {
  const ratio = width / height;
  if (ratio > 1.2) return "1536x1024"; // 가로형
  if (ratio < 0.83) return "1024x1536"; // 세로형
  return "1024x1024"; // 정사각형에 가까움
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "AI 배경을 쓰려면 서버에 OPENAI_API_KEY 를 설정해야 해요. (.env.local 또는 배포 환경변수)",
      },
      { status: 501 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const b = body as { prompt?: unknown; width?: unknown; height?: unknown };
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 });
  }

  const width = Number(b.width) || 1080;
  const height = Number(b.height) || 1080;
  const size = pickSize(width, height);

  // 피사체를 얹을 "빈 배경"이 나오도록 프롬프트를 감싼다.
  const fullPrompt =
    "Empty product-photography backdrop scene. No product, no objects, no people, no text, no logo. " +
    "A clean surface with a soft horizon where floor meets wall, gentle studio lighting and depth, " +
    `photographic and high quality. Mood/style: ${prompt}`;

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: fullPrompt,
        n: IMAGE_COUNT,
        size,
        quality: "medium",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `이미지 생성 실패 (${res.status})`, detail: detail.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { data?: { b64_json?: string }[] };
    const images = (data.data ?? [])
      .map((d) => d.b64_json)
      .filter((v): v is string => !!v)
      .map((b64) => `data:image/png;base64,${b64}`);

    if (images.length === 0) {
      return NextResponse.json({ error: "생성된 이미지가 없습니다." }, { status: 502 });
    }

    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했어요.", detail: String((err as Error)?.message ?? err) },
      { status: 500 }
    );
  }
}
