"use client";

import { MOODS, type MoodKey } from "@/lib/backgrounds";

interface MoodSelectorProps {
  selected: MoodKey | null;
  onSelect: (mood: MoodKey) => void;
  disabled?: boolean;
}

export default function MoodSelector({
  selected,
  onSelect,
  disabled,
}: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {MOODS.map((mood) => {
        const isActive = selected === mood.key;
        return (
          <button
            key={mood.key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(mood.key)}
            aria-pressed={isActive}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? "border-ink ring-2 ring-ink/10"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span
              className="h-10 w-full rounded-lg border border-black/5"
              style={{ background: mood.swatch }}
            />
            <span className="text-sm font-semibold text-ink">{mood.label}</span>
            <span className="text-xs leading-tight text-neutral-500">
              {mood.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
