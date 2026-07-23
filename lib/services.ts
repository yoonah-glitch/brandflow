// ─────────────────────────────────────────────────────────────
// 다시(DASI) 서비스 레지스트리
//
// 멀티 서비스 브랜드. 새 서비스를 추가하려면 이 배열에 항목을 하나 더 넣고
// (status:"active" + href), 해당 라우트 폴더(예: app/music/)를 만들면 됩니다.
// ─────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  label: string; // "다시, 책"
  emoji: string;
  status: "active" | "soon";
  href?: string; // active 인 경우 이동 경로
}

export const SERVICES: Service[] = [
  { id: "book", label: "다시, 책", emoji: "📖", status: "active", href: "/book" },
  { id: "music", label: "다시, 음악", emoji: "🎧", status: "soon" },
  { id: "movie", label: "다시, 영화", emoji: "🎬", status: "soon" },
  { id: "walk", label: "다시, 산책", emoji: "🌿", status: "soon" },
];
