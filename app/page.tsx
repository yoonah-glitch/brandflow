"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Chip from "@/components/Chip";
import ProgressBar from "@/components/ProgressBar";
import Logo from "@/components/Logo";
import { STEPS, TOTAL_STEPS, progressLabel } from "@/lib/steps";
import {
  EMPTY_ANSWERS,
  FREE_LIMIT,
  STORAGE_KEYS,
  type Answers,
} from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);

  const step = STEPS[stepIndex];

  // 현재 단계 답변 여부
  const isAnswered = useMemo(() => {
    const val = answers[step.key];
    if (step.type === "chip-multi") return Array.isArray(val) && val.length > 0;
    if (step.type === "text") return true; // 텍스트는 스킵 가능해서 항상 진행 가능
    return typeof val === "string" && val.length > 0;
  }, [answers, step]);

  function setValue(key: keyof Answers, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  function goBack() {
    if (stepIndex === 0) {
      setStarted(false);
    } else {
      setStepIndex((i) => i - 1);
    }
  }

  function finish() {
    // 새 온보딩 완료 → 결과 상태 초기화
    try {
      localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(answers));
      localStorage.removeItem(STORAGE_KEYS.lastResult);
      localStorage.removeItem(STORAGE_KEYS.seenTitles);
      localStorage.setItem(STORAGE_KEYS.remaining, String(FREE_LIMIT));
    } catch {
      /* localStorage 불가 환경 무시 */
    }
    router.push("/result");
  }

  // 단일 선택: 선택 즉시 다음 단계로 (시각 피드백 후)
  function selectSingle(value: string) {
    setValue(step.key, value);
    window.setTimeout(() => {
      setStepIndex((i) => (i < TOTAL_STEPS - 1 ? i + 1 : i));
      if (stepIndex === TOTAL_STEPS - 1) finish();
    }, 220);
  }

  function toggleMulti(value: string) {
    const cur = (answers[step.key] as string[]) ?? [];
    // "없어요" 는 단독 선택
    if (value === "없어요") {
      setValue(step.key, cur.includes("없어요") ? [] : ["없어요"]);
      return;
    }
    const without = cur.filter((v) => v !== "없어요");
    setValue(
      step.key,
      without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value],
    );
  }

  // ── 인트로 화면 ──────────────────────────────
  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 pb-11 pt-[72px] text-center">
        <div className="animate-fade-up flex flex-col items-center gap-5">
          <div style={{ filter: "drop-shadow(0 18px 30px rgba(232,103,74,0.5))" }}>
            <Logo size={92} />
          </div>
          <h1 className="text-[40px] font-bold tracking-[-0.5px] text-ink">
            Bookmatch
          </h1>
          <p className="-mt-1.5 max-w-[290px] text-[15.5px] leading-[1.7] text-muted">
            여덟 가지 짧은 질문에 답하면
            <br />
            지금 당신의 마음에 꼭 맞는
            <br />
            <span className="font-bold text-brand-dark">책 한 권</span>을 찾아드려요.
          </p>
          <button
            type="button"
            onClick={() => {
              setStepIndex(0);
              setStarted(true);
            }}
            className="mt-4 w-full max-w-[290px] rounded-full bg-gradient-to-br from-brand to-brand-light px-6 py-4 text-[16px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(232,103,74,0.7)] transition-transform active:scale-95"
          >
            내 책 이상형 찾기 →
          </button>
          <p className="text-[12.5px] text-faint">1분이면 충분해요 · 무료 3회</p>
          <Link
            href="/pricing"
            className="border-b-[1.5px] border-[rgba(232,103,74,0.35)] pb-px text-[13.5px] font-semibold text-brand-dark hover:border-brand"
          >
            요금제 보기
          </Link>
        </div>
      </main>
    );
  }

  // ── 온보딩 단계 ──────────────────────────────
  return (
    <main className="flex min-h-screen flex-col px-6 pb-8 pt-6">
      {/* 상단: 뒤로가기 + 진행률 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
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
        <div className="flex-1">
          <ProgressBar
            current={stepIndex + 1}
            total={TOTAL_STEPS}
            label={progressLabel(stepIndex)}
          />
        </div>
      </div>

      {/* 질문 본문 */}
      <div key={stepIndex} className="animate-fade-up mt-10 flex-1">
        <h2 className="text-[25px] font-bold leading-[1.3] tracking-[-0.5px] text-ink">
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="mt-2.5 text-[14px] leading-[1.55] text-muted">
            {step.subtitle}
          </p>
        )}

        {/* 칩 선택 */}
        {(step.type === "chip-single" || step.type === "chip-multi") && (
          <>
            <div
              className={
                step.key === "mbti"
                  ? "mt-[26px] flex flex-wrap gap-[9px]"
                  : "mt-[30px] flex flex-wrap gap-2.5"
              }
            >
              {step.options?.map((opt) => {
                const val = answers[step.key];
                const selected =
                  step.type === "chip-multi"
                    ? Array.isArray(val) && val.includes(opt)
                    : val === opt;
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={selected}
                    variant={step.key === "mbti" ? "mbti" : "default"}
                    onClick={() =>
                      step.type === "chip-multi"
                        ? toggleMulti(opt)
                        : selectSingle(opt)
                    }
                  />
                );
              })}
            </div>
            {step.unsureLabel && (
              <button
                type="button"
                onClick={() => selectSingle("")}
                className="mt-3 w-full rounded-full border-[1.4px] border-dashed border-line-2 py-[13px] text-[14px] font-medium text-muted transition-colors hover:border-[#e6c9b4] hover:bg-brand-tint hover:text-brand-dark active:scale-[0.98]"
              >
                {step.unsureLabel}
              </button>
            )}
          </>
        )}

        {/* 텍스트 입력 */}
        {step.type === "text" && (
          <input
            type="text"
            value={(answers[step.key] as string) ?? ""}
            onChange={(e) => setValue(step.key, e.target.value)}
            placeholder={step.placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") goNext();
            }}
            className="mt-[30px] w-full rounded-[18px] border-[1.4px] border-line-2 bg-brand-tint px-4 py-[15px] text-[16px] text-ink outline-none transition-all placeholder:text-faint focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
            autoFocus
          />
        )}
      </div>

      {/* 하단 버튼: 스킵 + 다음 */}
      <div className="mt-[26px] flex flex-col gap-1.5">
        {step.type !== "chip-single" && (
          <button
            type="button"
            onClick={goNext}
            disabled={!isAnswered}
            className="w-full rounded-full bg-gradient-to-br from-brand to-brand-light px-6 py-4 text-[16px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(232,103,74,0.7)] transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[#e7d9cb] disabled:from-[#e7d9cb] disabled:to-[#e7d9cb] disabled:shadow-none"
          >
            {stepIndex === TOTAL_STEPS - 1 ? "책 추천받기 →" : "다음"}
          </button>
        )}
        {step.skippable && (
          <button
            type="button"
            onClick={goNext}
            className="w-full py-2 text-[14px] font-medium text-faint transition-colors hover:text-muted"
          >
            건너뛰기
          </button>
        )}
      </div>
    </main>
  );
}
