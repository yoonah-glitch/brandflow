// 온보딩 응답 데이터 모델
export interface Answers {
  mood: string; // 1. 요즘 기분
  mbti: string; // 2. MBTI
  lifeBook: string; // 3. 인생책 (스킵 가능)
  coverTaste: string; // 4. 표지 취향
  place: string; // 5. 읽는 장소
  want: string; // 6. 원하는 것
  dislikes: string[]; // 7. 싫어하는 것 (복수선택)
  recentBooks: string; // 8. 최근 읽은 책 (스킵 가능)
}

export const EMPTY_ANSWERS: Answers = {
  mood: "",
  mbti: "",
  lifeBook: "",
  coverTaste: "",
  place: "",
  want: "",
  dislikes: [],
  recentBooks: "",
};

// Claude 가 반환하는 추천 결과 (JSON)
export interface Recommendation {
  title: string;
  author: string;
  reason: string;
  match: number; // 85-99
  difficulty: number; // 1-5 난이도
  emotion: number; // 1-5 감성
  thickness: number; // 1-5 두께
  yes24_query: string;
  kakao_query: string;
}

// 카카오 책 검색 결과 (필요한 필드만)
export interface KakaoBook {
  title: string;
  authors: string[];
  thumbnail: string; // 표지 이미지 URL
  url: string; // 다음책 상세 링크
  publisher: string;
  contents: string;
}

// 결과 화면에서 사용하는, 추천 + 표지 이미지를 합친 형태
export interface ResultBook extends Recommendation {
  cover: string | null; // 카카오에서 찾은 표지 이미지 (없으면 null)
  kakaoAuthors: string[]; // 카카오가 알려준 저자 (보정용)
}

// localStorage 키
export const STORAGE_KEYS = {
  answers: "bookmatch:answers",
  lastResult: "bookmatch:lastResult",
  remaining: "bookmatch:remaining",
  seenTitles: "bookmatch:seenTitles",
  invitedBonus: "bookmatch:invitedBonus",
} as const;

export const FREE_LIMIT = 3; // 무료 추천 횟수
