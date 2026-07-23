"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PREMIUM_FEATURES = [
  "다시, 책 무제한",
  "매일 밤 체크인",
  "월간 감정 독서 리포트",
  "감정 책장",
  "나중에 음악/영화/산책 추가 시 자동 포함",
];

// 다시 구독 페이지 (결제는 UI 전용 — 실제 결제 없음)
export default function SubscribePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="flex flex-col px-6 pb-14 pt-6">
      {/* 뒤로가기 */}
      <div className="mb-2 flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand-soft hover:text-brand-dark"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-bold tracking-[-0.5px] text-ink">
          다시, 곁에 두기
        </h1>
        <p className="mt-3 text-[14px] leading-[1.65] text-muted">
          지친 밤마다 조용히 곁을 지키는
          <br />
          다시 구독이에요.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 무료 */}
        <div className="rounded-3xl border border-line bg-paper p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16.5px] font-bold text-ink">무료</h3>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold text-brand-dark">
              현재 이용 중
            </span>
          </div>
          <p className="mt-3 font-serif text-[24px] font-bold text-ink">
            월 3회
          </p>
          <p className="mt-1.5 text-[13.5px] text-muted">
            가볍게 마음을 들여다보기
          </p>
        </div>

        {/* 다시 구독 (강조) */}
        <div className="relative rounded-3xl border-2 border-brand bg-brand-soft p-6">
          <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-[11px] font-bold tracking-[0.5px] text-white">
            추천
          </span>
          <h3 className="text-[16.5px] font-bold text-ink">다시 구독</h3>
          <div className="mt-2.5 flex items-end gap-1.5">
            <span className="font-serif text-[28px] font-bold text-ink">
              6,900원
            </span>
            <span className="pb-1 text-[13px] text-muted">/ 월</span>
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {PREMIUM_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-ink"
              >
                <span className="mt-[2px] font-extrabold text-brand">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-6 w-full rounded-full bg-brand px-4 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
          >
            구독하기
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-faint">
        언제든 해지할 수 있어요 · 결제 기능은 곧 열립니다
      </p>

      {/* "준비 중입니다" 팝업 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,38,30,0.45)] px-8"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-fade-up w-full max-w-[310px] rounded-3xl bg-paper p-7 text-center shadow-[0_30px_70px_rgba(56,50,42,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[40px]">🌙</div>
            <h3 className="mt-3.5 text-[19px] font-bold text-ink">
              준비 중입니다
            </h3>
            <p className="mt-2.5 text-[14px] leading-[1.65] text-muted">
              결제 기능은 곧 열릴 예정이에요.
              <br />
              조금만 기다려주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-full bg-brand px-4 py-4 text-[16px] font-bold text-white transition-transform active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
