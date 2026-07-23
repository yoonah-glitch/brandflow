import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 알라딘 검색 결과에서 화면에 필요한 필드만 추린 형태
export interface AladinBook {
  cover: string; // 표지 이미지 URL
  title: string;
  author: string;
  priceSales: number; // 판매가
  link: string; // 알라딘 상품 링크 (ttbkey 제휴 추적 포함)
}

interface AladinItem {
  title?: string;
  author?: string;
  link?: string;
  cover?: string;
  priceSales?: number;
}

interface AladinResponse {
  item?: AladinItem[];
  errorCode?: number;
  errorMessage?: string;
}

// 알라딘 output=js 응답을 안전하게 JSON 파싱한다.
function parseAladin(text: string): AladinResponse {
  try {
    return JSON.parse(text) as AladinResponse;
  } catch {
    // 앞뒤 잡음이 있을 경우 첫 { ~ 마지막 } 만 추출해 재시도
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as AladinResponse;
    }
    throw new Error("알라딘 응답 파싱 실패");
  }
}

export async function GET(req: NextRequest) {
  // 환경변수 우선, 없으면 제공된 TTB 키를 기본값으로 사용
  const ttbKey = process.env.ALADIN_TTB_KEY || "ttbya07361549001";
  const query = req.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "검색어가 없어요." }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      ttbkey: ttbKey,
      Query: query,
      QueryType: "Title",
      MaxResults: "1",
      SearchTarget: "Book",
      output: "js",
      Version: "20131101",
    });
    // 아웃바운드 프록시 대응을 위해 https 사용 (알라딘 TTB API 는 https 지원)
    const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params.toString()}`;

    const res = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { book: null, error: `알라딘 API 오류 (${res.status})` },
        { status: 200 },
      );
    }

    const text = await res.text();
    const data = parseAladin(text);

    if (data.errorCode) {
      // 키/쿼터 오류 등: 앱이 죽지 않도록 null 반환
      return NextResponse.json({
        book: null,
        error: data.errorMessage || `알라딘 오류 ${data.errorCode}`,
      });
    }

    const item = data.item?.[0];
    if (!item) {
      return NextResponse.json({ book: null });
    }

    const book: AladinBook = {
      cover: item.cover ?? "",
      title: item.title ?? "",
      author: item.author ?? "",
      priceSales: typeof item.priceSales === "number" ? item.priceSales : 0,
      link: item.link ?? "",
    };

    return NextResponse.json({ book });
  } catch (err) {
    console.error("aladin error:", err);
    // 표지/링크 실패는 치명적이지 않으므로 200 으로 null 반환
    return NextResponse.json({ book: null, error: "알라딘 검색 실패" });
  }
}
