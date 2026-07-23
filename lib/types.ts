// ─────────────────────────────────────────────────────────────
// 다시, 책 — 공용 타입 · localStorage 키 · 무료 횟수
// ─────────────────────────────────────────────────────────────

// 3단계 플로우 응답 데이터 모델
export interface Answers {
  situations: string[]; // 1. 지금 어떤 상황이에요? (복수 선택)
  want: string; // 2. 책이 어떻게 해줬으면 해요? (단일 선택)
  lastBook: string; // 3. 마지막으로 읽은 책 (스킵 가능)
}

export const EMPTY_ANSWERS: Answers = {
  situations: [],
  want: "",
  lastBook: "",
};

// Claude 가 반환하는 추천 결과 (JSON)
export interface Recommendation {
  emotion: string; // 감정 언어화 2줄 (시적, 줄바꿈 포함 가능)
  title: string; // 책제목
  author: string; // 저자
  reason: string; // 이 책이 왜 맞는지 1줄
  firstpage: string; // 첫 페이지 분위기 한 줄
  match: number; // 85-99
  thickness: number; // 1-5 두께
  aladin_query: string; // 알라딘 검색어
  coupang_query: string; // 쿠팡 검색어
}

// 결과 화면에서 사용하는, 추천 + 표지/구매정보를 합친 형태
export interface ResultBook extends Recommendation {
  cover: string | null; // 표지 이미지 (알라딘)
  aladinLink: string | null; // 알라딘 상품 링크 (ttbkey 제휴 추적 포함)
  priceSales: number | null; // 알라딘 판매가
}

// localStorage 키 (서비스 네임스페이스 dasi:book:*)
export const STORAGE_KEYS = {
  answers: "dasi:book:answers",
  lastResult: "dasi:book:lastResult",
  remaining: "dasi:book:remaining",
  seenTitles: "dasi:book:seenTitles",
  checkin: "dasi:book:checkin", // 다음날 체크인 알림 설정 플래그
} as const;

export const FREE_LIMIT = 3; // 무료 추천 횟수 (월 3회)
