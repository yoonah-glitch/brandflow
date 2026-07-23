import type { ResultBook } from "./types";

// 화면에 그릴 구매처 버튼
export interface StoreLink {
  name: string; // 예: "예스24"
  url: string; // 실제 이동 링크 (제휴 파라미터 포함 가능)
}

// 템플릿 문자열의 {query} 를 URL 인코딩된 검색어로 치환
function fill(template: string, query: string): string {
  return template.split("{query}").join(encodeURIComponent(query));
}

/**
 * 책 한 권에 대한 구매처 링크들을 만든다.
 *
 * 제휴(어필리에이트) 링크는 코드에 박지 않고 환경변수로 주입한다.
 * - NEXT_PUBLIC_*_LINK_TEMPLATE 에 제휴 링크 템플릿을 넣으면 그걸 사용하고,
 * - 비어 있으면 각 서점의 일반 검색 URL(제휴 없음)로 폴백한다.
 * 이렇게 하면 제휴 승인 전에도 앱이 정상 동작하고,
 * 승인 후엔 .env 값만 바꿔 끼우면 전 서점 링크가 한 번에 제휴 링크로 바뀐다.
 *
 * 템플릿 예시:
 *   NEXT_PUBLIC_YES24_LINK_TEMPLATE="https://.../redirect?pid=내ID&url=https%3A%2F%2Fwww.yes24.com%2FProduct%2FSearch%3Fquery%3D{query}"
 * (자세한 형식은 각 제휴 네트워크/파트너스 대시보드에서 발급받은 값을 사용)
 */
// 쿠팡 파트너스 ID (환경변수로 덮어쓸 수 있고, 없으면 기본값 사용)
const COUPANG_AFFILIATE_ID =
  process.env.NEXT_PUBLIC_COUPANG_AFFILIATE_ID || "AF8666448";

export function buildStoreLinks(book: ResultBook): StoreLink[] {
  // 서점 검색어 (Claude 가 준 예스24 검색어를 공용으로 사용)
  const q = (book.yes24_query || book.title || "").trim();
  const links: StoreLink[] = [];

  // ── 알라딘 ──────────────────────────────
  // 알라딘 API 가 준 상품 링크(link, ttbkey 제휴 추적 포함)를 우선 사용.
  // 없으면 알라딘 검색 페이지로 폴백.
  links.push({
    name: "알라딘",
    url:
      book.aladinLink ||
      `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${encodeURIComponent(q)}`,
  });

  // ── 쿠팡 (쿠팡 파트너스) ──────────────────
  // 지정 형식: /np/search?q={책제목}&channel=user&affiliate={파트너스ID}
  // 템플릿이 설정돼 있으면 그걸 우선 사용한다.
  const coupangTpl = process.env.NEXT_PUBLIC_COUPANG_LINK_TEMPLATE;
  links.push({
    name: "쿠팡",
    url: coupangTpl
      ? fill(coupangTpl, q)
      : `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}&channel=user&affiliate=${encodeURIComponent(COUPANG_AFFILIATE_ID)}`,
  });

  // ── 예스24 ─────────────────────────────
  const yes24Tpl = process.env.NEXT_PUBLIC_YES24_LINK_TEMPLATE;
  links.push({
    name: "예스24",
    url: yes24Tpl
      ? fill(yes24Tpl, q)
      : `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(q)}`,
  });

  // ── 교보문고 ────────────────────────────
  const kyoboTpl = process.env.NEXT_PUBLIC_KYOBO_LINK_TEMPLATE;
  links.push({
    name: "교보문고",
    url: kyoboTpl
      ? fill(kyoboTpl, q)
      : `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(q)}`,
  });

  return links;
}
