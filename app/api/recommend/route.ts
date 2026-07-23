import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Answers, Recommendation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

// 사용자가 지정한 시스템 프롬프트
const SYSTEM_PROMPT = `너는 세계 최고의 책 큐레이터야.
사용자 정보를 깊이 분석해서 실제 존재하는
한국 책 또는 한국어 번역본을 딱 1권만 추천해.
절대 존재하지 않는 책을 만들어내지 마.
싫어하는 것과 최근 읽은 책은 절대 추천하지 마.
반드시 아래 JSON만 반환해, 다른 텍스트 없이:
{
  "title": "책제목",
  "author": "저자명",
  "reason": "추천이유 2-3문장 따뜻한 톤",
  "match": 85-99사이 숫자,
  "difficulty": 1-5 난이도,
  "emotion": 1-5 감성,
  "thickness": 1-5 두께,
  "yes24_query": "예스24검색어",
  "kakao_query": "카카오검색어"
}`;

// 응답 텍스트에서 첫 번째 JSON 객체를 뽑아낸다.
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON 을 찾을 수 없습니다.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function clamp(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// 온보딩 응답 + 제외 목록으로 사용자 프롬프트를 만든다.
function buildUserPrompt(answers: Answers, exclude: string[]): string {
  const dislikes =
    answers.dislikes && answers.dislikes.length > 0
      ? answers.dislikes.filter((d) => d !== "없어요").join(", ") || "없음"
      : "없음";

  const lines = [
    "아래는 한 독자의 정보야. 깊이 분석해서 책 딱 한 권을 추천해줘.",
    "",
    `- 요즘 기분: ${answers.mood || "미입력"}`,
    `- MBTI: ${answers.mbti || "미입력"}`,
    `- 인생책: ${answers.lifeBook?.trim() || "없음"}`,
    `- 선호하는 표지 취향: ${answers.coverTaste || "상관없음"}`,
    `- 주로 읽는 장소: ${answers.place || "미입력"}`,
    `- 이 책에서 얻고 싶은 것: ${answers.want || "미입력"}`,
    `- 싫어하는 것(절대 추천 금지): ${dislikes}`,
    `- 최근 읽은 책(중복 추천 금지): ${answers.recentBooks?.trim() || "없음"}`,
  ];

  if (exclude.length > 0) {
    lines.push(
      `- 이미 추천했던 책(다시 추천 금지): ${exclude.join(", ")}`,
      "위 목록과는 다른, 새로운 책을 추천해줘.",
    );
  }

  lines.push("", "반드시 시스템 프롬프트에 명시된 JSON 형식만 반환해.");
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았어요." },
      { status: 500 },
    );
  }

  let body: { answers?: Answers; exclude?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const answers = body.answers;
  const exclude = Array.isArray(body.exclude) ? body.exclude : [];
  if (!answers) {
    return NextResponse.json(
      { error: "답변 데이터가 없어요." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(answers, exclude) }],
    });

    // 텍스트 블록만 이어붙인다 (thinking 블록 제외)
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const raw = extractJson(text) as Record<string, unknown>;

    const rec: Recommendation = {
      title: String(raw.title ?? "").trim(),
      author: String(raw.author ?? "").trim(),
      reason: String(raw.reason ?? "").trim(),
      match: clamp(raw.match, 85, 99, 90),
      difficulty: clamp(raw.difficulty, 1, 5, 3),
      emotion: clamp(raw.emotion, 1, 5, 3),
      thickness: clamp(raw.thickness, 1, 5, 3),
      yes24_query: String(raw.yes24_query ?? raw.title ?? "").trim(),
      kakao_query: String(raw.kakao_query ?? raw.title ?? "").trim(),
    };

    if (!rec.title) {
      throw new Error("추천 제목이 비어있어요.");
    }

    return NextResponse.json(rec);
  } catch (err) {
    console.error("recommend error:", err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Claude API 오류 (${err.status ?? "?"})`
        : "추천을 만드는 중 문제가 생겼어요. 다시 시도해주세요.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
