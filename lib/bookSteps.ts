import type { Answers } from "./types";

// ─────────────────────────────────────────────────────────────
// 다시, 책 — 3단계 플로우 정의
// ─────────────────────────────────────────────────────────────

export type BookStepType = "multi" | "single" | "text";

export interface BookStep {
  key: keyof Answers;
  type: BookStepType;
  title: string; // 질문 제목
  subtitle?: string; // 보조 설명
  options?: string[]; // 선택지
  placeholder?: string; // 텍스트 입력 placeholder
  skippable?: boolean; // 건너뛰기 가능 여부
}

export const BOOK_STEPS: BookStep[] = [
  {
    key: "situations",
    type: "multi",
    title: "지금 어떤 상황이에요?",
    subtitle: "여러 개 골라도 괜찮아요",
    options: [
      "💔 연애가 힘들어요",
      "👨‍👩‍👧 가족이랑 문제가 있어요",
      "😢 소중한 사람을 잃었어요",
      "🏢 직장/학교가 너무 힘들어요",
      "😶 그냥 무기력해요",
      "😰 불안하고 걱정이 많아요",
      "🫥 외롭고 공허해요",
      "💭 나 자신을 모르겠어요",
      "😮‍💨 그냥 다 지쳐요",
      "🤷 딱히 이유는 모르겠어요",
    ],
  },
  {
    key: "want",
    type: "single",
    title: "책이 어떻게 해줬으면 해요?",
    options: [
      "그냥 같이 있어줬으면",
      "다른 세계로 데려가줬으면",
      "뭔가 깨닫게 해줬으면",
      "그냥 재밌었으면",
    ],
  },
  {
    key: "lastBook",
    type: "text",
    title: "마지막으로 읽은 책은?",
    subtitle: "없으면 건너뛰어도 괜찮아요",
    placeholder: "예) 아몬드, 불편한 편의점...",
    skippable: true,
  },
];

export const TOTAL_BOOK_STEPS = BOOK_STEPS.length;

// 결과 로딩 중 조용히 교체되는 문구
export const LOADING_MESSAGES = [
  "당신의 마음을 읽는 중...",
  "지금 이 마음에 맞는 책을 고르는 중...",
  "책장을 조용히 넘기는 중...",
];
