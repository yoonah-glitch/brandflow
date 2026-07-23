"use client";

import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta?: string; // 결제 버튼 문구 (무료 플랜은 없음)
  highlight?: boolean; // 강조 카드
  badge?: string; // 우측 상단 배지
  current?: boolean; // 현재 이용 중 표시
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "무료",
    price: "0원",
    period: "",
    desc: "가볍게 시작하기",
    features: ["월 3회 책 추천", "매치 분석 · 추천 이유", "알라딘 · 쿠팡 구매 링크"],
    current: true,
  },
  {
    id: "monthly",
    name: "월간 프리미엄",
    price: "3,900원",
    period: "/ 월",
    desc: "무제한으로 마음껏",
    features: ["무제한 책 추천", "무제한 재추천", "모든 무료 기능 포함"],
    cta: "프리미엄 시작하기",
    highlight: true,
  },
  {
    id: "annual",
    name: "연간 프리미엄",
    price: "29,000원",
    period: "/ 년",
    desc: "월 2,417원 꼴 · 약 38% 절약",
    features: ["무제한 책 추천", "무제한 재추천", "2개월치 무료 혜택"],
    cta: "연간 프리미엄 시작하기",
    badge: "BEST",
  },
];

export default function PricingPlans() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={[
            "relative rounded-xl2 border p-5 transition-all",
            plan.highlight
              ? "border-brand bg-brand-soft/50 shadow-[0_8px_30px_rgba(83,74,183,0.12)]"
              : "border-gray-200 bg-white",
          ].join(" ")}
        >
          {plan.badge && (
            <span className="absolute -top-2.5 right-4 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow">
              {plan.badge}
            </span>
          )}

          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] font-bold text-ink">{plan.name}</h3>
            {plan.current && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                현재 이용 중
              </span>
            )}
          </div>

          <div className="mt-2 flex items-end gap-1">
            <span className="text-2xl font-extrabold text-ink">
              {plan.price}
            </span>
            {plan.period && (
              <span className="pb-0.5 text-[13px] text-gray-400">
                {plan.period}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-brand">{plan.desc}</p>

          <ul className="mt-4 flex flex-col gap-2">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-[14px] text-gray-600"
              >
                <span className="text-brand">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {plan.cta && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={[
                "mt-5 w-full rounded-full px-4 py-3 text-[15px] font-semibold transition-colors active:scale-95",
                plan.highlight
                  ? "bg-brand text-white hover:bg-brand-dark"
                  : "border border-brand text-brand hover:bg-brand-soft",
              ].join(" ")}
            >
              {plan.cta}
            </button>
          )}
        </div>
      ))}

      <p className="mt-1 text-center text-[12px] text-gray-400">
        언제든 해지할 수 있어요. 결제 기능은 곧 오픈됩니다.
      </p>

      {/* "준비 중입니다" 팝업 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-fade-up w-full max-w-xs rounded-xl2 bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">🚧</div>
            <h3 className="mt-3 text-lg font-bold text-ink">준비 중입니다</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
              결제 기능은 곧 오픈될 예정이에요.
              <br />
              조금만 기다려주세요!
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-full bg-brand px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
