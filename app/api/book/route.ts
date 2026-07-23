import { NextRequest, NextResponse } from "next/server";
import type { KakaoBook } from "@/lib/types";

export const runtime = "nodejs";

interface KakaoResponse {
  documents: Array<{
    title: string;
    authors: string[];
    thumbnail: string;
    url: string;
    publisher: string;
    contents: string;
  }>;
}

// 카카오 책 검색 API 로 표지 이미지 등을 가져온다.
export async function GET(req: NextRequest) {
  const apiKey = process.env.KAKAO_API_KEY;
  const query = req.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "검색어가 없어요." }, { status: 400 });
  }

  // 키가 없어도 앱이 죽지 않도록: 표지 없이 진행하도록 빈 결과 반환
  if (!apiKey) {
    return NextResponse.json({ book: null, reason: "no_kakao_key" });
  }

  try {
    const url =
      "https://dapi.kakao.com/v3/search/book?target=title&size=3&query=" +
      encodeURIComponent(query);

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      // 카카오 응답을 짧게 캐싱해 중복 호출 비용을 줄인다.
      next: { revalidate: 60 * 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { book: null, error: `카카오 API 오류 (${res.status})` },
        { status: 200 },
      );
    }

    const data = (await res.json()) as KakaoResponse;
    const doc = data.documents?.[0];
    if (!doc) {
      return NextResponse.json({ book: null });
    }

    const book: KakaoBook = {
      title: doc.title,
      authors: doc.authors ?? [],
      thumbnail: doc.thumbnail ?? "",
      url: doc.url ?? "",
      publisher: doc.publisher ?? "",
      contents: doc.contents ?? "",
    };

    return NextResponse.json({ book });
  } catch (err) {
    console.error("kakao book error:", err);
    // 표지 실패는 치명적이지 않으므로 200 으로 null 반환
    return NextResponse.json({ book: null, error: "표지 검색 실패" });
  }
}
