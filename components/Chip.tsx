"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

// 둥근 선택 칩. 선택되면 보라색으로 채워진다.
export default function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "rounded-full border px-4 py-2.5 text-[15px] font-medium transition-all duration-150 active:scale-95",
        selected
          ? "border-brand bg-brand text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-brand/40 hover:bg-brand-soft",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
