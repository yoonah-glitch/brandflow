"use client";

interface ProgressBarProps {
  current: number; // 1-based 현재 단계
  total: number;
  label: string; // "3/8 단계 · 거의 다 왔어요!"
}

// 상단 진행률 바 + 문구
export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <p className="mb-[9px] text-[12.5px] font-semibold text-brand-dark">
        {label}
      </p>
      <div
        className="h-[5px] w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
