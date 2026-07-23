"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import { LOADING_MESSAGES } from "@/lib/steps";
import {
  FREE_LIMIT,
  STORAGE_KEYS,
  type Answers,
  type KakaoBook,
  type Recommendation,
  type ResultBook,
} from "@/lib/types";

// 로딩 중 랜덤 문구를 1.8초마다 교체
function LoadingView() {
  const [msg, setMsg] = useState(LOADING_MESSAGES[0]);
  useEffect(() => {
    const pick = () =>
      LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setMsg(pick());
    const id = window.setInterval(() => setMsg(pick()), 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-brand/20" />
        <span className="text-4xl">📖</span>
      </div>
      <p className="animate-fade-up text-center text-[16px] font-medium text-gray-600">
        {msg}
      </p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-brand"
            style={{
              animation: "pulseDot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [book, setBook] = useState<ResultBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // 재추천/별로예요 진행중
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const didInit = useRef(false);

  // localStorage 헬퍼
  const readSeen = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.seenTitles) || "[]");
    } catch {
      return [];
    }
  };
  const writeSeen = (titles: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.seenTitles, JSON.stringify(titles));
    } catch {
      /* ignore */
    }
  };

  // 추천 1건 가져오기 (Claude → 카카오 표지)
  const fetchBook = useCallback(
    async (ans: Answers, exclude: string[]): Promise<ResultBook> => {
      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans, exclude }),
      });
      const recData = await recRes.json();
      if (!recRes.ok) throw new Error(recData.error || "추천 실패");
      const rec = recData as Recommendation;

      // 카카오 표지 (실패해도 계속 진행)
      let cover: string | null = null;
      let kakaoAuthors: string[] = [];
      try {
        const bookRes = await fetch(
          "/api/book?query=" + encodeURIComponent(rec.kakao_query || rec.title),
        );
        const bookData = (await bookRes.json()) as { book: KakaoBook | null };
        if (bookData.book) {
          cover = bookData.book.thumbnail || null;
          kakaoAuthors = bookData.book.authors || [];
        }
      } catch {
        /* 표지 없이 진행 */
      }

      return { ...rec, cover, kakaoAuthors };
    },
    [],
  );

  const persistResult = (result: ResultBook) => {
    try {
      localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
    } catch {
      /* ignore */
    }
  };

  // 최초 진입: 저장된 결과가 있으면 복원, 없으면 새로 추천
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let ans: Answers | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.answers);
      ans = raw ? (JSON.parse(raw) as Answers) : null;
      const r = localStorage.getItem(STORAGE_KEYS.remaining);
      if (r !== null) setRemaining(Number(r) || 0);
    } catch {
      ans = null;
    }

    if (!ans) {
      router.replace("/");
      return;
    }
    setAnswers(ans);

    // 저장된 마지막 결과 복원
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.lastResult);
      if (cached) {
        setBook(JSON.parse(cached) as ResultBook);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }

    // 새 추천
    (async () => {
      try {
        const result = await fetchBook(ans, readSeen());
        setBook(result);
        persistResult(result);
        writeSeen([...readSeen(), result.title]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "추천에 실패했어요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, fetchBook]);

  // 재추천 (횟수 차감) / 별로예요 (무료) 공통 로직
  const reRecommend = async (chargeCount: boolean) => {
    if (!answers || busy) return;
    if (chargeCount && remaining <= 0) return;
    setBusy(true);
    setError(null);
    // 현재 책도 제외 목록에 포함
    const exclude = Array.from(
      new Set([...readSeen(), ...(book ? [book.title] : [])]),
    );
    try {
      const result = await fetchBook(answers, exclude);
      setBook(result);
      persistResult(result);
      writeSeen([...exclude, result.title]);
      if (chargeCount) {
        const next = Math.max(0, remaining - 1);
        setRemaining(next);
        try {
          localStorage.setItem(STORAGE_KEYS.remaining, String(next));
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 추천하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const handleBonus = () => {
    const next = remaining + 1;
    setRemaining(next);
    try {
      localStorage.setItem(STORAGE_KEYS.remaining, String(next));
    } catch {
      /* ignore */
    }
  };

  if (loading) return <LoadingView />;

  return (
    <main className="flex min-h-screen flex-col px-6 pb-12 pt-6">
      {/* 헤더 */}
      <header className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-brand"
        >
          Bookmatch
        </Link>
        <Link
          href="/"
          className="text-[13px] font-medium text-gray-400 hover:text-gray-600"
        >
          처음부터 다시
        </Link>
      </header>

      <p className="mb-4 text-[15px] text-gray-500">
        당신을 위한 오늘의 책을 찾았어요 ✨
      </p>

      {/* 재추천 진행 중 오버레이 대신 상단 표시 */}
      {busy && (
        <div className="mb-4 rounded-xl2 bg-brand-soft px-4 py-3 text-center text-[14px] font-medium text-brand">
          새로운 책을 고르는 중...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl2 bg-red-50 px-4 py-3 text-center text-[14px] text-red-600">
          {error}
          <button
            type="button"
            onClick={() => reRecommend(false)}
            className="ml-2 font-semibold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {book && answers && (
        <BookCard
          book={book}
          answers={answers}
          remaining={remaining}
          busy={busy}
          onReRecommend={() => reRecommend(true)}
          onDislike={() => reRecommend(false)}
          onBonus={handleBonus}
        />
      )}
    </main>
  );
}
