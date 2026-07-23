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

// API 키가 없을 때(무료 배포) 사용하는 샘플 추천 목록.
// 실제 존재하는 책들로 구성되어 있어 키 없이도 앱이 정상 동작한다.
const SAMPLE_BOOKS: Recommendation[] = [
  {
    title: "여름은 오래 그곳에 남아",
    author: "마쓰이에 마사시",
    reason:
      "복잡한 마음을 천천히 가라앉히고 싶은 지금, 조용한 산장에서 흐르는 시간을 담은 이 소설이 잘 맞아요. 미니멀한 문장과 따뜻한 결이 카페에서 읽기에도 좋고, 무엇보다 잔잔한 위로를 건네줍니다.",
    match: 94,
    difficulty: 2,
    emotion: 4,
    thickness: 3,
    yes24_query: "여름은 오래 그곳에 남아",
    kakao_query: "여름은 오래 그곳에 남아",
  },
  {
    title: "아침의 피아노",
    author: "김진영",
    reason:
      "삶의 마지막 순간까지 하루하루를 기록한 철학자의 문장들이, 답을 강요하지 않고 곁에 조용히 머물러요. 짧은 글이 모여 있어 부담 없이 펼칠 수 있고, 지친 마음에 깊은 위안을 줍니다.",
    match: 91,
    difficulty: 2,
    emotion: 5,
    thickness: 2,
    yes24_query: "아침의 피아노",
    kakao_query: "아침의 피아노",
  },
  {
    title: "여행의 이유",
    author: "김영하",
    reason:
      "떠나고 싶지만 떠나지 못하는 마음을 다독여주는 산문집이에요. 위트 있는 문장 사이사이 생각할 거리가 놓여 있어, 복잡한 머릿속을 환기하기에 딱 좋습니다.",
    match: 89,
    difficulty: 2,
    emotion: 3,
    thickness: 3,
    yes24_query: "여행의 이유",
    kakao_query: "여행의 이유",
  },
  {
    title: "어린이라는 세계",
    author: "김소영",
    reason:
      "아이들을 곁에서 지켜본 어른의 다정한 시선이, 조급했던 마음을 부드럽게 풀어줘요. 따뜻하고 유쾌한 장면들이 많아 읽는 내내 마음이 환해집니다.",
    match: 92,
    difficulty: 1,
    emotion: 4,
    thickness: 3,
    yes24_query: "어린이라는 세계",
    kakao_query: "어린이라는 세계",
  },
];

// 제외 목록에 없는 샘플 책을 하나 고른다. 모두 제외됐으면 아무거나 반환.
function pickSample(exclude: string[]): Recommendation {
  const available = SAMPLE_BOOKS.filter((b) => !exclude.includes(b.title));
  const pool = available.length > 0 ? available : SAMPLE_BOOKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

  // 무료 모드: API 키가 없으면 에러 대신 샘플 책으로 추천한다.
  if (!apiKey) {
    return NextResponse.json(pickSample(exclude));
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
