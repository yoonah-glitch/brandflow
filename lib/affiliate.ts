import type { ResultBook } from "./types";

// 화면에 그릴 구매처 버튼
export interface StoreLink {
  name: string; // 예: "알라딘"
  url: string; // 실제 이동 링크 (제휴 파라미터 포함 가능)
}

// 쿠팡 파트너스 ID (환경변수로 덮어쓸 수 있고, 없으면 기본값 사용)
const COUPANG_ID = process.env.NEXT_PUBLIC_COUPANG_ID || "AF8666448";

/**
 * 책 한 권에 대한 구매처 링크(알라딘 · 쿠팡)를 만든다.
 *
 * - 알라딘: 알라딘 API 가 준 상품 링크(link, ttbkey 제휴 추적 포함)를 우선 사용하고,
 *   없으면 알라딘 검색 페이지로 폴백한다.
 * - 쿠팡: 쿠팡 파트너스 검색 링크. 파트너스 ID 는 NEXT_PUBLIC_COUPANG_ID 로 주입한다.
 */
export function buildStoreLinks(book: ResultBook): StoreLink[] {
  const aladinQuery = (book.aladin_query || book.title || "").trim();
  const coupangQuery = (book.coupang_query || book.title || "").trim();

  return [
    {
      name: "알라딘",
      url:
        book.aladinLink ||
        `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${encodeURIComponent(aladinQuery)}`,
    },
    {
      name: "쿠팡",
      // 지정 형식: /np/search?q={책제목}&channel=user&affiliate={파트너스ID}
      url: `https://www.coupang.com/np/search?q=${encodeURIComponent(coupangQuery)}&channel=user&affiliate=${encodeURIComponent(COUPANG_ID)}`,
    },
  ];
}
