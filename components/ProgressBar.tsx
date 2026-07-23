interface ProgressBarProps {
  current: number; // 1-based 현재 단계
  total: number;
  label?: string; // "1/3"
}

// 상단 진행률 바 + 문구 (3단계)
export default function ProgressBar({
  current,
  total,
  label,
}: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <p className="mb-2 text-[12.5px] font-semibold text-brand-dark">
        {label ?? `${current}/${total}`}
      </p>
      <div
        className="h-[5px] w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
