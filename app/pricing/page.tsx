"use client";

import { useRouter } from "next/navigation";
import PricingPlans from "@/components/PricingPlans";

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col px-6 pb-10 pt-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
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
        <h1 className="text-xl font-extrabold tracking-tight text-ink">요금제</h1>
      </div>

      <p className="mb-6 text-[15px] leading-relaxed text-gray-500">
        무료로도 매달 3권을 추천받을 수 있어요.
        <br />
        더 자주 읽는 분이라면 <span className="font-semibold text-brand">무제한</span>
        으로 즐겨보세요.
      </p>

      <PricingPlans />
    </main>
  );
}
