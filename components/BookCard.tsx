"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="overflow-hidden rounded-[28px] border border-[#f4ece0] bg-white shadow-[0_24px_60px_-28px_rgba(176,74,44,0.42),0_2px_8px_rgba(176,74,44,0.06)]">
        {/* 표지 + 매치 */}
        <div className="relative flex justify-center bg-[radial-gradient(90%_80%_at_50%_0%,#fbeadd_0%,#ffffff_72%)] px-[22px] pb-[30px] pt-10">
          {/* 은은한 글로우 */}
          <div
            className="pointer-events-none absolute left-1/2 top-[46px] z-0 h-[210px] w-[190px] -translate-x-1/2 rounded-full opacity-50 blur-[38px]"
            style={{ background: "#D77A54" }}
          />
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt={`${book.title} 표지`}
              className="relative z-[1] h-[228px] w-[156px] rounded-[6px_10px_10px_6px] object-cover shadow-[0_22px_40px_-14px_rgba(70,40,20,0.42)]"
            />
          ) : (
            <div
              className="relative z-[1] flex h-[228px] w-[156px] flex-col items-center justify-center overflow-hidden rounded-[6px_10px_10px_6px] px-[18px] py-5 text-center text-white shadow-[0_22px_40px_-14px_rgba(70,40,20,0.42)]"
              style={{ background: "linear-gradient(155deg,#D77A54,#A8492C)" }}
            >
              {/* 책등 */}
              <span className="absolute inset-y-0 left-0 w-[9px] bg-black/15" />
              {/* 광택 */}
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative z-[2] font-serif text-[19px] font-bold leading-[1.32] [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">
                {book.title}
              </span>
              <span className="relative z-[2] mt-3 text-[11px] tracking-[0.3px] opacity-85">
                {book.author}
              </span>
            </div>
          )}
          {/* 매치 배지 */}
          <div className="absolute right-[26px] top-[26px] z-[2] flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full bg-white shadow-[0_8px_20px_-6px_rgba(176,74,44,0.5)]">
            <b className="font-serif text-[18px] font-bold leading-none text-brand-dark">
              {book.match}
            </b>
            <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.5px] text-brand">
              % match
            </span>
          </div>
        </div>

        {/* 제목/저자/이유 */}
        <div className="flex flex-col gap-4 px-[22px] pb-6 pt-[22px]">
          <div>
            <h2 className="font-serif text-[22px] font-bold leading-[1.28] tracking-[-0.2px] text-ink">
              {book.title}
            </h2>
            <p className="mt-1.5 text-[13.5px] text-muted">{book.author}</p>
            {book.priceSales ? (
              <span className="mt-2.5 inline-flex items-center gap-1.5 self-start rounded-full bg-brand-soft px-3 py-1.5 text-[12.5px] font-semibold text-brand-dark">
                📖 알라딘 판매가 {book.priceSales.toLocaleString("ko-KR")}원
              </span>
            ) : null}
          </div>

          <p className="text-[15px] leading-[1.68] text-[#4a4239]">
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
            <div className="animate-fade-up rounded-[18px] border border-[#f4e2d3] bg-gradient-to-b from-brand-soft to-brand-tint px-[17px] py-4 text-[14px] leading-[1.7] text-[#4a4239]">
              <span className="font-serif text-[22px] leading-[0] text-brand">
                &ldquo;
              </span>
              {explain}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExplain}
              disabled={explainLoading}
              className="rounded-full border-[1.4px] border-[#ecd9c8] py-[13px] text-[14px] font-semibold text-brand-dark transition-colors hover:border-[#e6c9b4] hover:bg-brand-soft disabled:opacity-60"
            >
              {explainLoading
                ? "큐레이터가 이야기 준비 중..."
                : "왜 이 책인지 더 알고 싶어요"}
            </button>
          )}
          {explainError && (
            <p className="text-[13px] text-red-500">{explainError}</p>
          )}

          {/* 구매처 (제휴 링크) */}
          <div>
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.3px] text-faint">
              구매하러 가기
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {storeLinks.map((store, i) => (
                <a
                  key={store.name}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={[
                    "flex items-center justify-center rounded-full px-2 py-3.5 text-[14.5px] font-semibold transition-all active:scale-[0.97]",
                    i === 0
                      ? "bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_10px_22px_-10px_rgba(232,103,74,0.7)]"
                      : "border-[1.4px] border-[#ecdccb] text-[#57493d] hover:bg-brand-tint",
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
            className="flex items-center justify-center gap-1.5 rounded-full border-[1.4px] border-[#ecdccb] py-3.5 text-[14.5px] font-semibold text-[#57493d] transition-colors hover:bg-brand-tint disabled:opacity-60"
          >
            {saving ? "저장 중..." : "📸 인스타 공유카드 저장"}
          </button>
        </div>
      </div>

      {/* 친구 초대 */}
      <button
        type="button"
        onClick={handleInvite}
        className="flex items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-[#e6c1a6] bg-brand-tint px-4 py-[15px] text-[14px] font-semibold text-brand-dark transition-colors hover:border-brand-light hover:bg-brand-soft"
      >
        {copied
          ? "링크 복사 완료! 추천 1회가 추가됐어요 🎉"
          : "🎁 친구 초대하고 추천 1회 더 받기"}
      </button>

      {/* 재추천 영역 */}
      <div className="flex flex-col gap-3 rounded-[22px] border border-line bg-white px-[18px] py-[18px] shadow-[0_10px_30px_-20px_rgba(176,74,44,0.32)]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted">
            남은 무료 추천
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-[11px] py-[5px] text-[13px] font-bold text-brand-dark">
            {remaining}회 남음
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDislike}
            disabled={busy}
            className="rounded-full border-[1.4px] border-[#ecdccb] bg-white px-4 py-3.5 text-[13.5px] font-semibold text-[#57493d] transition-all hover:bg-brand-tint active:scale-[0.97] disabled:opacity-60"
          >
            🙈 이 책 별로예요
          </button>
          <button
            type="button"
            onClick={onReRecommend}
            disabled={busy || remaining <= 0}
            className="rounded-full bg-gradient-to-br from-brand to-brand-light px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(232,103,74,0.7)] transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:from-[#e7d9cb] disabled:to-[#e7d9cb] disabled:shadow-none"
          >
            🔄 다른 책 추천
          </button>
        </div>
        <p className="text-center text-[11.5px] text-faint">
          &lsquo;별로예요&rsquo;는 횟수 차감 없이 다시 골라드려요.
        </p>

        {/* 프리미엄 업그레이드 안내 */}
        {remaining <= 0 ? (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-brand to-brand-light px-4 py-3.5 text-[13.5px] font-bold text-white shadow-[0_12px_26px_-10px_rgba(232,103,74,0.7)]"
          >
            무료 추천을 다 썼어요 · 무제한으로 →
          </Link>
        ) : (
          <div className="text-center">
            <Link
              href="/pricing"
              className="border-b-[1.5px] border-[rgba(232,103,74,0.35)] pb-px text-[13.5px] font-semibold text-brand-dark hover:border-brand"
            >
              프리미엄으로 무제한 추천받기
            </Link>
          </div>
        )}
      </div>

      {/* 쿠팡 파트너스 고지 (결과 카드 하단에만 노출) */}
      <p className="px-1.5 pb-1.5 pt-1 text-center text-[10.5px] leading-[1.65] text-faint">
        이 서비스는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를
        제공받습니다.
      </p>
    </div>
  );
}
