import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Answers, Recommendation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

// 지정된 시스템 프롬프트 (그대로 사용)
const SYSTEM_PROMPT = `너는 지친 사람의 마음을 읽어주는
따뜻한 친구야.
입력받은 정보로:
1. 감정을 2줄로 시적으로 언어화
2. 실제 존재하는 한국 책 딱 1권 추천
3. 존재하지 않는 책 절대 만들지 마

JSON으로만 반환:
{
  "emotion": "감정 언어화 2줄",
  "title": "책제목",
  "author": "저자",
  "reason": "이 책이 왜 맞는지 1줄",
  "firstpage": "첫 페이지 분위기 한 줄",
  "match": 85-99,
  "thickness": 1-5,
  "aladin_query": "알라딘검색어",
  "coupang_query": "쿠팡검색어"
}`;

// API 키가 없을 때(무료 배포) 사용하는 샘플 추천 목록.
// 실제 존재하는 한국 책들로 구성되어 있어 키 없이도 앱이 정상 동작한다.
const SAMPLE_BOOKS: Recommendation[] = [
  {
    emotion: "당신은 지금\n조용히 무너지지 않으려 애쓰고 있어요",
    title: "아침의 피아노",
    author: "김진영",
    reason: "답을 재촉하지 않고 곁에 머무는 문장들이 지친 마음을 가만히 안아줘요.",
    firstpage: "창밖의 빛이 스며드는 아침, 한 사람이 하루를 조용히 받아 적기 시작한다.",
    match: 92,
    thickness: 2,
    aladin_query: "아침의 피아노",
    coupang_query: "아침의 피아노",
  },
  {
    emotion: "복잡한 마음을\n어딘가 먼 곳에 잠시 내려놓고 싶은 날이에요",
    title: "여름은 오래 그곳에 남아",
    author: "마쓰이에 마사시",
    reason: "산장에 흐르는 느린 시간이, 급했던 마음의 속도를 천천히 늦춰줘요.",
    firstpage: "숲으로 둘러싸인 산장, 매미 소리 사이로 여름이 오래 머문다.",
    match: 90,
    thickness: 3,
    aladin_query: "여름은 오래 그곳에 남아",
    coupang_query: "여름은 오래 그곳에 남아",
  },
  {
    emotion: "괜찮은 척했지만\n사실은 오래 지쳐 있었던 거예요",
    title: "죽고 싶지만 떡볶이는 먹고 싶어",
    author: "백세희",
    reason: "완벽하지 않아도 괜찮다는 다정한 대화가, 혼자가 아니라고 말해줘요.",
    firstpage: "무너질 것 같은 날에도 떡볶이는 먹고 싶은, 그 마음을 아무도 이상하다 하지 않는다.",
    match: 94,
    thickness: 2,
    aladin_query: "죽고 싶지만 떡볶이는 먹고 싶어",
    coupang_query: "죽고 싶지만 떡볶이는 먹고 싶어",
  },
  {
    emotion: "남들의 속도에 맞추느라\n정작 나를 자꾸 잃어버렸어요",
    title: "나는 나로 살기로 했다",
    author: "김수현",
    reason: "타인의 시선에서 한 걸음 물러나 나를 지키는 법을 조용히 일러줘요.",
    firstpage: "누구의 삶도 아닌, 오직 나로 사는 하루가 여기서 시작된다.",
    match: 91,
    thickness: 2,
    aladin_query: "나는 나로 살기로 했다",
    coupang_query: "나는 나로 살기로 했다",
  },
];

// 제외 목록에 없는 샘플 책을 하나 고른다. 모두 제외됐으면 아무거나 반환.
function pickSample(exclude: string[]): Recommendation {
  const available = SAMPLE_BOOKS.filter((b) => !exclude.includes(b.title));
  const pool = available.length > 0 ? available : SAMPLE_BOOKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 응답 텍스트에서 첫 { ~ 마지막 } 구간의 JSON 을 뽑아낸다.
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

// 3단계 응답 + 제외 목록으로 사용자 프롬프트를 만든다.
function buildUserPrompt(answers: Answers, exclude: string[]): string {
  const situations =
    answers.situations && answers.situations.length > 0
      ? answers.situations.join(", ")
      : "미입력";

  const lines = [
    "아래는 지친 한 사람의 마음이야. 깊이 읽고 지금 이 마음에 맞는 책 딱 한 권을 추천해줘.",
    "",
    `- 지금 상황: ${situations}`,
    `- 책이 해줬으면 하는 것: ${answers.want || "미입력"}`,
    `- 마지막으로 읽은 책: ${answers.lastBook?.trim() || "없음"}`,
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

  // 무료 모드: API 키가 없으면 에러 대신 샘플 책으로 추천한다. (비용 0)
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

    // 텍스트 블록만 이어붙인다
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const raw = extractJson(text) as Record<string, unknown>;

    const rec: Recommendation = {
      emotion: String(raw.emotion ?? "").trim(),
      title: String(raw.title ?? "").trim(),
      author: String(raw.author ?? "").trim(),
      reason: String(raw.reason ?? "").trim(),
      firstpage: String(raw.firstpage ?? "").trim(),
      match: clamp(raw.match, 85, 99, 90),
      thickness: clamp(raw.thickness, 1, 5, 3),
      aladin_query: String(raw.aladin_query ?? raw.title ?? "").trim(),
      coupang_query: String(raw.coupang_query ?? raw.title ?? "").trim(),
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
