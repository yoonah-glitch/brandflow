"use client";

import { useState } from "react";
import type { Answers, ResultBook } from "@/lib/types";
import Thermometer from "./Thermometer";
import { downloadShareCard } from "@/lib/shareCard";
import { buildStoreLinks } from "@/lib/affiliate";

interface BookCardProps {
  book: ResultBook;
  answers: Answers;
  remaining: number;
  busy: boolean; // 재추천/별로예요 진행 중
  onReRecommend: () => void;
  onDislike: () => void;
  onBonus: () => void; // 친구 초대 성공 시 +1
}

export default function BookCard({
  book,
  answers,
  remaining,
  busy,
  onReRecommend,
  onDislike,
  onBonus,
}: BookCardProps) {
  const [explain, setExplain] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const storeLinks = buildStoreLinks(book);

  async function handleExplain() {
    if (explainLoading) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          title: book.title,
          author: book.author,
          reason: book.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "실패");
      setExplain(data.explanation);
    } catch (e) {
      setExplainError(
        e instanceof Error ? e.message : "설명을 불러오지 못했어요.",
      );
    } finally {
      setExplainLoading(false);
    }
  }

  async function handleInvite() {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const link = `${base}/?invite=1`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // 클립보드 실패해도 보너스는 지급 (수동 공유 가정)
    }
    setCopied(true);
    onBonus();
    window.setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare() {
    setSaving(true);
    try {
      await downloadShareCard(book);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {/* 카드 본체 */}
      <div className="overflow-hidden rounded-xl2 border border-gray-100 bg-white shadow-[0_8px_30px_rgba(83,74,183,0.10)]">
        {/* 표지 + 매치 */}
        <div className="relative flex justify-center bg-brand-soft/60 px-6 pb-6 pt-8">
          <div className="relative">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={`${book.title} 표지`}
                className="h-[220px] w-[150px] rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="flex h-[220px] w-[150px] items-center justify-center rounded-lg bg-brand px-3 text-center text-sm font-semibold text-white shadow-md">
                {book.title}
              </div>
            )}
            {/* 매치 배지 */}
            <div className="absolute -right-3 -top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-brand text-white shadow-lg">
              <span className="text-[15px] font-extrabold leading-none">
                {book.match}%
              </span>
              <span className="mt-0.5 text-[9px] leading-none opacity-90">
                match
              </span>
            </div>
          </div>
        </div>

        {/* 제목/저자/이유 */}
        <div className="flex flex-col gap-3 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold leading-snug text-ink">
              {book.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{book.author}</p>
            {book.priceSales ? (
              <p className="mt-1 text-[13px] font-semibold text-brand">
                알라딘 판매가 {book.priceSales.toLocaleString("ko-KR")}원
              </p>
            ) : null}
          </div>

          <p className="text-[15px] leading-relaxed text-gray-700">
            {book.reason}
          </p>

          {/* 책 온도계 */}
          <Thermometer
            difficulty={book.difficulty}
            emotion={book.emotion}
            thickness={book.thickness}
          />

          {/* 왜 이 책인지 더 알고 싶어요 */}
          {explain ? (
            <div className="animate-fade-up rounded-xl2 border border-brand/15 bg-brand-soft/40 px-4 py-3 text-[14px] leading-relaxed text-gray-700">
              {explain}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExplain}
              disabled={explainLoading}
              className="rounded-full border border-brand/30 px-4 py-2.5 text-[14px] font-medium text-brand transition-colors hover:bg-brand-soft disabled:opacity-60"
            >
              {explainLoading
                ? "큐레이터가 이야기 준비 중..."
                : "💬 왜 이 책인지 더 알고 싶어요"}
            </button>
          )}
          {explainError && (
            <p className="text-[13px] text-red-500">{explainError}</p>
          )}

          {/* 구매처 (제휴 링크) */}
          <div className="mt-1">
            <p className="mb-2 text-[13px] font-medium text-gray-500">
              구매하러 가기
            </p>
            <div className="grid grid-cols-2 gap-2">
              {storeLinks.map((store, i) => (
                <a
                  key={store.name}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={[
                    "flex items-center justify-center rounded-full px-2 py-3 text-[14px] font-semibold transition-colors",
                    i === 0
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {store.name}
                </a>
              ))}
            </div>
          </div>

          {/* 공유카드 저장 */}
          <button
            type="button"
            onClick={handleShare}
            disabled={saving}
            className="flex items-center justify-center rounded-full border border-gray-200 px-4 py-3 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "📸 인스타 공유카드 저장"}
          </button>
        </div>
      </div>

      {/* 친구 초대 */}
      <button
        type="button"
        onClick={handleInvite}
        className="flex items-center justify-center gap-2 rounded-xl2 border border-dashed border-brand/40 bg-brand-soft/40 px-4 py-3 text-[14px] font-medium text-brand transition-colors hover:bg-brand-soft"
      >
        {copied ? "링크 복사 완료! 추천 1회가 추가됐어요 🎉" : "🔗 친구 초대하고 추천 1회 더 받기"}
      </button>

      {/* 재추천 영역 */}
      <div className="flex flex-col gap-2 rounded-xl2 bg-gray-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">남은 무료 추천</span>
          <span className="text-[14px] font-bold text-brand">
            {remaining}회
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDislike}
            disabled={busy}
            className="rounded-full border border-gray-200 bg-white px-4 py-3 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            🙈 이 책 별로예요
          </button>
          <button
            type="button"
            onClick={onReRecommend}
            disabled={busy || remaining <= 0}
            className="rounded-full bg-brand px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            🔄 다른 책 추천 (1회)
          </button>
        </div>
        <p className="text-center text-[12px] text-gray-400">
          &lsquo;별로예요&rsquo;는 횟수 차감 없이 다시 골라드려요.
        </p>
      </div>
    </div>
  );
}
