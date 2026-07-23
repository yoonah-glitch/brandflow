import type { Answers } from "./types";

export type StepType = "chip-single" | "chip-multi" | "text";

export interface StepConfig {
  key: keyof Answers;
  type: StepType;
  title: string; // 질문 제목
  subtitle?: string; // 보조 설명
  options?: string[]; // 칩 선택지
  placeholder?: string; // 텍스트 입력 placeholder
  skippable?: boolean; // 스킵 가능 여부
}

// 8단계 온보딩 정의 (순서대로)
export const STEPS: StepConfig[] = [
  {
    key: "mood",
    type: "chip-single",
    title: "요즘 기분이 어때요?",
    subtitle: "지금 마음에 가장 가까운 걸 골라주세요",
    options: [
      "번아웃",
      "복잡해",
      "울적해",
      "설레",
      "답답해",
      "고민중",
      "평온해",
      "의욕넘쳐",
    ],
  },
  {
    key: "mbti",
    type: "chip-single",
    title: "MBTI를 알려주세요",
    subtitle: "취향을 더 잘 읽기 위해서예요",
    options: [
      "ISTJ", "ISFJ", "INFJ", "INTJ",
      "ISTP", "ISFP", "INFP", "INTP",
      "ESTP", "ESFP", "ENFP", "ENTP",
      "ESTJ", "ESFJ", "ENFJ", "ENTJ",
    ],
  },
  {
    key: "lifeBook",
    type: "text",
    title: "인생책이 있나요?",
    subtitle: "제목만 적어도 좋아요. 없으면 넘어가도 돼요",
    placeholder: "예) 미움받을 용기, 데미안...",
    skippable: true,
  },
  {
    key: "coverTaste",
    type: "chip-single",
    title: "어떤 표지에 끌려요?",
    subtitle: "책은 표지빨이라고들 하잖아요",
    options: ["미니멀", "화려", "사진", "일러스트", "상관없어요"],
  },
  {
    key: "place",
    type: "chip-single",
    title: "주로 어디서 읽어요?",
    subtitle: "당신의 독서 스팟이 궁금해요",
    options: ["카페", "침대", "출퇴근길", "공원", "소파"],
  },
  {
    key: "want",
    type: "chip-single",
    title: "이 책에서 얻고 싶은 건?",
    subtitle: "지금 가장 필요한 한 가지",
    options: ["위로", "영감", "설렘", "지식", "재미", "생각거리"],
  },
  {
    key: "dislikes",
    type: "chip-multi",
    title: "이런 건 피하고 싶어요",
    subtitle: "여러 개 골라도 괜찮아요",
    options: [
      "공포스릴러",
      "자기계발",
      "슬픈결말",
      "무거운주제",
      "500페이지이상",
      "SF판타지",
      "로맨스",
      "없어요",
    ],
  },
  {
    key: "recentBooks",
    type: "text",
    title: "최근 읽은 책이 있나요?",
    subtitle: "중복 추천을 피하기 위해서예요. 없으면 넘어가도 돼요",
    placeholder: "예) 불편한 편의점, 아몬드...",
    skippable: true,
  },
];

export const TOTAL_STEPS = STEPS.length;

// "3/8 단계 · 거의 다 왔어요!" 진행률 문구
export function progressLabel(stepIndex: number): string {
  const current = stepIndex + 1;
  const ratio = current / TOTAL_STEPS;
  let tail: string;
  if (current === 1) tail = "시작해볼까요?";
  else if (ratio < 0.5) tail = "좋아요, 계속 가볼게요";
  else if (ratio < 0.75) tail = "절반 넘었어요!";
  else if (current < TOTAL_STEPS) tail = "거의 다 왔어요!";
  else tail = "마지막이에요!";
  return `${current}/${TOTAL_STEPS} 단계 · ${tail}`;
}

// 로딩 중 랜덤 문구
export const LOADING_MESSAGES = [
  "책장 뒤지는 중...",
  "독서가 500명 취향 분석 중...",
  "당신의 책 이상형 찾는 중...",
];
