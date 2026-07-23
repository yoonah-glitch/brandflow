"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

// 둥근 선택 칩. 선택되면 클레이 포인트 컬러로 채워진다(흰 글자).
export default function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "rounded-full border px-[17px] py-[11px] text-left text-[15px] font-medium transition-colors duration-150 active:scale-[0.98]",
        selected
          ? "border-transparent bg-brand text-white"
          : "border-line bg-paper text-ink hover:border-brand/50 hover:bg-brand-soft",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
