"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AladinBook } from "@/app/api/aladin/route";
import { LOADING_MESSAGES } from "@/lib/bookSteps";
import { buildStoreLinks } from "@/lib/affiliate";
import { downloadShareCard } from "@/lib/shareCard";
import {
  FREE_LIMIT,
  STORAGE_KEYS,
  type Answers,
  type Recommendation,
  type ResultBook,
} from "@/lib/types";

const MIN_LOADING_MS = 1800;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 로딩 중 조용한 문구를 순서대로 교체
function LoadingView() {
  const [msg, setMsg] = useState(LOADING_MESSAGES[0]);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setMsg(LOADING_MESSAGES[i]);
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6">
      <span className="text-4xl">📖</span>
      <p className="animate-fade-up text-center text-[16px] text-muted">{msg}</p>
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

// ●●●○○ 두께 표시
function ThicknessDots({ value }: { value: number }) {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-1" aria-label={`두께 ${v}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-[7px] w-[7px] rounded-full ${i <= v ? "bg-brand" : "bg-line"}`}
        />
      ))}
    </span>
  );
}

export default function BookResultPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [book, setBook] = useState<ResultBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // 재추천 진행 중
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const [saving, setSaving] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const didInit = useRef(false);

  // ── localStorage 헬퍼 ──
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
  const persistResult = (result: ResultBook) => {
    try {
      localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
    } catch {
      /* ignore */
    }
  };

  // 추천 1건 가져오기 (Claude/샘플 → 알라딘 표지·링크·판매가)
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

      let cover: string | null = null;
      let aladinLink: string | null = null;
      let priceSales: number | null = null;

      // 알라딘: 표지 + 상품 링크 + 판매가 (실패해도 계속 진행)
      try {
        const alRes = await fetch(
          "/api/aladin?query=" +
            encodeURIComponent(rec.aladin_query || rec.title),
        );
        const alData = (await alRes.json()) as { book: AladinBook | null };
        if (alData.book) {
          cover = alData.book.cover || null;
          aladinLink = alData.book.link || null;
          priceSales = alData.book.priceSales || null;
        }
      } catch {
        /* 표지 없이 진행 */
      }

      return { ...rec, cover, aladinLink, priceSales };
    },
    [],
  );

  // 최초 진입: 저장된 결과 복원, 없으면 새로 추천 (최소 1.8s 로딩 유지)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let ans: Answers | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.answers);
      ans = raw ? (JSON.parse(raw) as Answers) : null;
      const r = localStorage.getItem(STORAGE_KEYS.remaining);
      if (r !== null) setRemaining(Number(r) || 0);
      setCheckedIn(localStorage.getItem(STORAGE_KEYS.checkin) === "1");
    } catch {
      ans = null;
    }

    // 답변이 없으면 홈으로
    if (!ans || !Array.isArray(ans.situations)) {
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

    // 새 추천 (조용한 로딩을 위해 최소 1.8초 유지)
    (async () => {
      try {
        const [result] = await Promise.all([
          fetchBook(ans, readSeen()),
          delay(MIN_LOADING_MS),
        ]);
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

  // 재추천 — chargeCount=true 면 남은 횟수 차감, false 면 무료
  const reRecommend = async (chargeCount: boolean) => {
    if (!answers || busy) return;
    if (chargeCount && remaining <= 0) return;
    setBusy(true);
    setError(null);
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

  async function handleShare() {
    if (!book) return;
    setSaving(true);
    try {
      await downloadShareCard(book);
    } finally {
      setSaving(false);
    }
  }

  // 다음날 체크인 알림 설정.
  // 참고: 실제 예약 푸시 알림은 백엔드(스케줄러 + 푸시 서버)가 필요합니다.
  // 여기서는 UI 레벨의 설정만 합니다 — 브라우저 권한 요청 + localStorage 플래그.
  async function handleCheckin() {
    try {
      if (
        typeof Notification !== "undefined" &&
        typeof Notification.requestPermission === "function"
      ) {
        await Notification.requestPermission();
      }
    } catch {
      /* 권한 요청 실패해도 UI 설정은 진행 */
    }
    try {
      localStorage.setItem(STORAGE_KEYS.checkin, "1");
    } catch {
      /* ignore */
    }
    setCheckedIn(true);
  }

  if (loading) return <LoadingView />;

  if (error && !book) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[15px] text-muted">{error}</p>
        <button
          type="button"
          onClick={() => reRecommend(false)}
          className="rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white"
        >
          다시 시도
        </button>
        <Link href="/book" className="text-[13.5px] text-faint underline">
          처음부터 다시
        </Link>
      </main>
    );
  }

  if (!book) return null;

  const emotionLines = book.emotion
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const storeLinks = buildStoreLinks(book);

  return (
    <main className="flex flex-col px-6 pb-10 pt-6">
      {busy && (
        <div className="mb-4 rounded-2xl bg-brand-soft px-4 py-3 text-center text-[14px] font-medium text-brand-dark">
          다른 책을 조용히 고르는 중...
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-2xl bg-[#F6EDE4] px-4 py-3 text-center text-[13.5px] text-muted">
          {error}
        </div>
      )}

      {/* 결과 카드 */}
      <div className="animate-fade-up overflow-hidden rounded-[26px] border border-line bg-paper">
        {/* 1. 감정 언어화 */}
        <section className="px-7 pt-9 pb-7 text-center">
          <p className="text-[13px] text-faint">지금 당신은…</p>
          <div className="mt-4 flex flex-col gap-1.5">
            {(emotionLines.length ? emotionLines : [book.emotion]).map(
              (line, i) => (
                <p
                  key={i}
                  className="text-[21px] font-bold leading-[1.6] tracking-[-0.3px] text-ink"
                >
                  {line}
                </p>
              ),
            )}
          </div>
        </section>

        <div className="mx-7 border-t border-line" />

        {/* 2. 책 소개 */}
        <section className="px-7 pt-7">
          <p className="text-center text-[14px] text-muted">
            이 책 속 주인공이 딱 그랬어요
          </p>

          <div className="mt-5 flex flex-col items-center">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={`${book.title} 표지`}
                className="h-[220px] w-[150px] rounded-lg object-cover shadow-[0_12px_30px_-16px_rgba(56,50,42,0.45)]"
              />
            ) : (
              <div className="flex h-[220px] w-[150px] items-center justify-center rounded-lg bg-gradient-to-b from-brand-soft to-[#E4D6C5] p-4 text-center">
                <span className="font-serif text-[16px] font-bold leading-snug text-brand-dark">
                  {book.title}
                </span>
              </div>
            )}

            <h2 className="mt-5 text-center font-serif text-[21px] font-bold leading-[1.3] tracking-[-0.2px] text-ink">
              {book.title}
            </h2>
            <p className="mt-1.5 text-[13.5px] text-muted">{book.author}</p>

            {book.reason && (
              <p className="mt-4 max-w-[300px] text-center text-[14.5px] leading-[1.7] text-[#5a5248]">
                {book.reason}
              </p>
            )}

            {/* 4. 매치 % + 두께 (은은하게) */}
            <div className="mt-5 flex items-center gap-4 text-[12px] text-faint">
              <span>지금 마음과 {book.match}% 닮았어요</span>
              <span className="flex items-center gap-1.5">
                <span>두께</span>
                <ThicknessDots value={book.thickness} />
              </span>
            </div>
          </div>
        </section>

        {/* 3. 첫 페이지 분위기 */}
        {book.firstpage && (
          <section className="mt-7 px-7">
            <p className="text-[12px] text-faint">첫 페이지 분위기</p>
            <blockquote className="mt-2.5 border-l-2 border-brand pl-4 text-[15px] italic leading-[1.75] text-muted">
              {book.firstpage}
            </blockquote>
          </section>
        )}

        {/* 5. 구매 버튼 */}
        <section className="px-7 pt-7">
          <div className="grid grid-cols-2 gap-2.5">
            {storeLinks.map((store, i) => (
              <a
                key={store.name}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={[
                  "flex items-center justify-center rounded-full px-2 py-3.5 text-[14.5px] font-semibold transition-transform active:scale-[0.98]",
                  i === 0
                    ? "bg-brand text-white"
                    : "border border-line bg-paper text-ink hover:bg-brand-soft",
                ].join(" ")}
              >
                {store.name}에서 보기
              </a>
            ))}
          </div>
          {book.priceSales ? (
            <p className="mt-2.5 text-center text-[12px] text-faint">
              알라딘 판매가 {book.priceSales.toLocaleString("ko-KR")}원
            </p>
          ) : null}
        </section>

        {/* 6. 공유 카드 */}
        <section className="px-7 pb-7 pt-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line bg-paper py-3.5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-brand-soft disabled:opacity-60"
          >
            {saving ? "카드 만드는 중..." : "결과 카드 저장하기"}
          </button>
        </section>
      </div>

      {/* 7. 다음날 체크인 알림 설정 */}
      <section className="mt-4">
        {checkedIn ? (
          <div className="rounded-2xl border border-line bg-brand-soft px-5 py-4 text-center text-[14px] leading-[1.6] text-brand-dark">
            내일 밤 조용히 찾아올게요 🌙
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheckin}
            className="w-full rounded-2xl border border-brand bg-paper px-5 py-4 text-center text-[14.5px] font-semibold leading-[1.5] text-brand-dark transition-colors hover:bg-brand-soft"
          >
            내일 밤, 다시 안부를 물어봐도 될까요?
          </button>
        )}
      </section>

      {/* 재추천 영역 */}
      <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-paper px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">이번 달 남은 무료 추천</span>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-[12.5px] font-bold text-brand-dark">
            {remaining}회
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => reRecommend(false)}
            disabled={busy}
            className="rounded-full border border-line bg-paper px-3 py-3.5 text-[13.5px] font-semibold text-ink transition-transform hover:bg-brand-soft active:scale-[0.98] disabled:opacity-60"
          >
            이 책 말고 다른 책
          </button>
          <button
            type="button"
            onClick={() => reRecommend(true)}
            disabled={busy || remaining <= 0}
            className="rounded-full bg-brand px-3 py-3.5 text-[13.5px] font-semibold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#DDD2C1] disabled:text-white/80"
          >
            새로 추천받기
          </button>
        </div>
        {remaining <= 0 ? (
          <Link
            href="/subscribe"
            className="rounded-full bg-brand px-4 py-3.5 text-center text-[13.5px] font-bold text-white"
          >
            무료 추천을 다 썼어요 · 다시 구독 보기
          </Link>
        ) : (
          <div className="text-center">
            <Link
              href="/subscribe"
              className="border-b border-brand/40 pb-px text-[13px] font-semibold text-brand-dark hover:border-brand"
            >
              무제한으로 읽고 싶다면 · 다시 구독
            </Link>
          </div>
        )}
      </section>

      {/* 쿠팡 파트너스 고지 (결과 화면 최하단에만) */}
      <p className="px-2 pb-1 pt-6 text-center text-[10.5px] leading-[1.65] text-faint">
        이 서비스는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를
        제공받습니다.
      </p>
    </main>
  );
}
