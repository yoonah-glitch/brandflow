import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Answers } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `너는 세계 최고의 책 큐레이터야.
이미 추천한 책이 이 독자에게 왜 잘 맞는지,
따뜻하고 다정한 말투로 4-6문장 정도 더 자세히 설명해줘.
독자의 기분, 상황, 취향과 책을 구체적으로 연결해서 설명해.
JSON 없이 자연스러운 한국어 문단으로만 답해. 마크다운이나 목록은 쓰지 마.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let body: {
    answers?: Answers;
    title?: string;
    author?: string;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const { answers, title, author, reason } = body;
  if (!title) {
    return NextResponse.json({ error: "책 정보가 없어요." }, { status: 400 });
  }

  // 무료 모드: API 키가 없으면 에러 대신 다정한 기본 설명을 돌려준다.
  if (!apiKey) {
    const explanation = [
      `《${title}》${author ? `(${author})` : ""}은 지금 당신의 마음에 특히 잘 어울리는 책이에요.`,
      reason ? reason : "",
      "천천히 한 장씩 넘기다 보면, 오늘의 기분과 상황에 조용히 스며드는 순간을 만나게 될 거예요. 부담 없이 첫 장을 펼쳐보세요. 이 책이 당신에게 좋은 위로가 되길 바라요.",
    ]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json({ explanation });
  }

  const dislikes =
    answers?.dislikes?.filter((d) => d !== "없어요").join(", ") || "없음";

  const userPrompt = [
    `추천한 책: "${title}"${author ? ` (${author})` : ""}`,
    `기존 추천 이유: ${reason || "(없음)"}`,
    "",
    "이 독자의 정보:",
    `- 기분: ${answers?.mood || "미입력"}`,
    `- MBTI: ${answers?.mbti || "미입력"}`,
    `- 인생책: ${answers?.lifeBook?.trim() || "없음"}`,
    `- 읽는 장소: ${answers?.place || "미입력"}`,
    `- 원하는 것: ${answers?.want || "미입력"}`,
    `- 싫어하는 것: ${dislikes}`,
    "",
    "이 책이 왜 이 독자에게 잘 맞는지 더 자세히 이야기해줘.",
  ].join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({ explanation: text });
  } catch (err) {
    console.error("explain error:", err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Claude API 오류 (${err.status ?? "?"})`
        : "설명을 불러오지 못했어요. 다시 시도해주세요.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
