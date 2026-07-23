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
    <div className="flex flex-col gap-[18px]">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={[
            "relative rounded-[24px] p-[22px] transition-all",
            plan.highlight
              ? "border-[1.4px] border-transparent bg-gradient-to-b from-white to-brand-tint shadow-[0_20px_44px_-22px_rgba(232,103,74,0.5),inset_0_0_0_1.6px_#E8674A]"
              : "border-[1.4px] border-line bg-white",
          ].join(" ")}
        >
          {plan.badge && (
            <span className="absolute -top-3 right-[18px] rounded-full bg-gradient-to-br from-brand to-brand-light px-[13px] py-[5px] text-[11px] font-bold tracking-[0.5px] text-white shadow-[0_6px_14px_-4px_rgba(232,103,74,0.7)]">
              {plan.badge}
            </span>
          )}

          <div className="flex items-baseline justify-between">
            <h3 className="text-[16.5px] font-bold text-ink">{plan.name}</h3>
            {plan.current && (
              <span className="rounded-full bg-brand-soft px-[11px] py-[5px] text-[11px] font-semibold text-brand-dark">
                현재 이용 중
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-end gap-1.5">
            <span className="font-serif text-[27px] font-bold text-ink">
              {plan.price}
            </span>
            {plan.period && (
              <span className="pb-[3px] text-[13px] text-faint">
                {plan.period}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-brand-dark">
            {plan.desc}
          </p>

          <ul className="mt-4 flex flex-col gap-[9px]">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-[9px] text-[14px] text-[#564e44]"
              >
                <span className="font-extrabold text-brand">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {plan.cta && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={[
                "mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-semibold transition-all active:scale-[0.97]",
                plan.highlight
                  ? "bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_12px_26px_-10px_rgba(232,103,74,0.7)]"
                  : "border-[1.4px] border-brand text-brand-dark hover:bg-brand-soft",
              ].join(" ")}
            >
              {plan.cta}
            </button>
          )}
        </div>
      ))}

      <p className="mt-1 text-center text-[12px] text-faint">
        언제든 해지할 수 있어요 · 결제 기능은 곧 오픈됩니다
      </p>

      {/* "준비 중입니다" 팝업 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,28,18,0.5)] px-[30px] backdrop-blur-[3px]"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-fade-up w-full max-w-[310px] rounded-[26px] bg-white p-[26px] pt-[30px] text-center shadow-[0_30px_70px_rgba(60,35,18,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[42px]">🚧</div>
            <h3 className="mt-3.5 text-[19px] font-bold text-ink">
              준비 중입니다
            </h3>
            <p className="mt-2.5 text-[14px] leading-[1.65] text-muted">
              결제 기능은 곧 오픈될 예정이에요.
              <br />
              조금만 기다려주세요!
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-[22px] w-full rounded-full bg-gradient-to-br from-brand to-brand-light px-4 py-4 text-[16px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(232,103,74,0.7)] transition-transform active:scale-[0.97]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
