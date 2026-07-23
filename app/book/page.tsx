"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Chip from "@/components/Chip";
import ProgressBar from "@/components/ProgressBar";
import { BOOK_STEPS, TOTAL_BOOK_STEPS } from "@/lib/bookSteps";
import {
  EMPTY_ANSWERS,
  FREE_LIMIT,
  STORAGE_KEYS,
  type Answers,
} from "@/lib/types";

// 다시, 책 — 3단계 플로우
export default function BookFlowPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);

  const step = BOOK_STEPS[stepIndex];
  const isLast = stepIndex === TOTAL_BOOK_STEPS - 1;

  // 현재 단계 답변 여부
  const isAnswered = useMemo(() => {
    const val = answers[step.key];
    if (step.type === "multi") return Array.isArray(val) && val.length > 0;
    if (step.type === "text") return true; // 텍스트는 건너뛰기 가능 → 항상 진행 가능
    return typeof val === "string" && val.length > 0;
  }, [answers, step]);

  function setValue(key: keyof Answers, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  function goBack() {
    if (stepIndex === 0) {
      router.push("/");
    } else {
      setStepIndex((i) => i - 1);
    }
  }

  function finish() {
    // 새 플로우 완료 → 결과 상태 초기화 후 결과 페이지로
    try {
      localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(answers));
      localStorage.removeItem(STORAGE_KEYS.lastResult);
      localStorage.removeItem(STORAGE_KEYS.seenTitles);
      localStorage.setItem(STORAGE_KEYS.remaining, String(FREE_LIMIT));
    } catch {
      /* localStorage 불가 환경 무시 */
    }
    router.push("/book/result");
  }

  // 단일 선택: 고르면 잠깐의 피드백 후 다음 단계로 (단일 단계는 마지막이 아님)
  function selectSingle(value: string) {
    setValue(step.key, value);
    window.setTimeout(
      () => setStepIndex((i) => Math.min(i + 1, TOTAL_BOOK_STEPS - 1)),
      200,
    );
  }

  function toggleMulti(value: string) {
    const cur = (answers[step.key] as string[]) ?? [];
    setValue(
      step.key,
      cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value],
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col px-6 pb-8 pt-6">
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
            total={TOTAL_BOOK_STEPS}
            label={`${stepIndex + 1}/${TOTAL_BOOK_STEPS}`}
          />
        </div>
      </div>

      {/* 질문 본문 */}
      <div key={stepIndex} className="animate-fade-up mt-10 flex-1">
        <h2 className="text-[24px] font-bold leading-[1.35] tracking-[-0.5px] text-ink">
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="mt-2.5 text-[14px] leading-[1.55] text-muted">
            {step.subtitle}
          </p>
        )}

        {/* 선택 칩 (multi / single) */}
        {(step.type === "multi" || step.type === "single") && (
          <div className="mt-8 flex flex-wrap gap-2.5">
            {step.options?.map((opt) => {
              const val = answers[step.key];
              const selected =
                step.type === "multi"
                  ? Array.isArray(val) && val.includes(opt)
                  : val === opt;
              return (
                <Chip
                  key={opt}
                  label={opt}
                  selected={selected}
                  onClick={() =>
                    step.type === "multi"
                      ? toggleMulti(opt)
                      : selectSingle(opt)
                  }
                />
              );
            })}
          </div>
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
            className="mt-8 w-full rounded-[18px] border border-line bg-paper px-4 py-[15px] text-[16px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand"
            autoFocus
          />
        )}
      </div>

      {/* 하단 버튼: 다음(multi/text) + 건너뛰기(text) */}
      <div className="mt-8 flex flex-col gap-1.5">
        {step.type !== "single" && (
          <button
            type="button"
            onClick={goNext}
            disabled={!isAnswered}
            className="w-full rounded-full bg-brand px-6 py-4 text-[16px] font-bold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#DDD2C1] disabled:text-white/80"
          >
            {isLast ? "책 추천받기" : "다음"}
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
