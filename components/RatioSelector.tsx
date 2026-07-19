"use client";

import { RATIOS, type RatioKey } from "@/lib/backgrounds";

interface RatioSelectorProps {
  selected: RatioKey;
  onSelect: (ratio: RatioKey) => void;
  disabled?: boolean;
}

export default function RatioSelector({
  selected,
  onSelect,
  disabled,
}: RatioSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {RATIOS.map((ratio) => {
        const isActive = selected === ratio.key;
        // 미리보기 박스 비율
        const isSquare = ratio.key === "1:1";
        return (
          <button
            key={ratio.key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(ratio.key)}
            aria-pressed={isActive}
            className={`flex flex-1 items-center gap-3 rounded-xl border p-3 transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[160px] ${
              isActive
                ? "border-ink ring-2 ring-ink/10"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span
              className={`shrink-0 rounded border-2 ${
                isActive ? "border-ink" : "border-neutral-300"
              } ${isSquare ? "h-8 w-8" : "h-10 w-8"}`}
            />
            <span className="text-left">
              <span className="block text-sm font-semibold text-ink">
                {ratio.key}
              </span>
              <span className="block text-xs text-neutral-500">
                {isSquare ? "정사각형" : "세로형"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
