"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "mbti";
}

// 둥근 선택 칩. 선택되면 따뜻한 코랄 그라디언트로 채워진다.
export default function Chip({
  label,
  selected,
  onClick,
  variant = "default",
}: ChipProps) {
  const sizing =
    variant === "mbti"
      ? "flex-1 basis-[calc(25%-9px)] justify-center px-1 py-3 text-[14px] font-semibold tracking-[0.5px]"
      : "px-[17px] py-[11px] text-[15px] font-medium";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "flex items-center rounded-full border-[1.4px] text-center transition-all duration-150 active:scale-95",
        sizing,
        selected
          ? "border-transparent bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_8px_20px_-6px_rgba(232,103,74,0.55)]"
          : "border-line-2 bg-white text-[#57493d] hover:border-[#e6c9b4] hover:bg-brand-tint",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
