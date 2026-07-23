"use client";

import { useRouter } from "next/navigation";
import PricingPlans from "@/components/PricingPlans";

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col px-6 pb-10 pt-6">
      {/* 헤더 */}
      <div className="mb-2 flex items-center gap-3">
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

      <div className="mb-[26px] text-center">
        <div className="text-[11.5px] font-bold uppercase tracking-[1.4px] text-brand">
          Bookmatch 프리미엄
        </div>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
          더 자주 읽는 당신에게
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted">
          무료로도 매달 3권을 추천받을 수 있어요.
          <br />
          제한 없이 즐기고 싶다면 프리미엄으로.
        </p>
      </div>

      <PricingPlans />
    </main>
  );
}
