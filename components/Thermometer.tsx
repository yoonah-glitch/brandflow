"use client";

interface ThermometerProps {
  difficulty: number; // 1-5
  emotion: number; // 1-5
  thickness: number; // 1-5
}

interface RowProps {
  label: string;
  value: number;
}

// ●●●○○ 형태의 한 줄
function Row({ label, value }: RowProps) {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="flex items-center gap-1" aria-label={`${label} ${v}/5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={[
              "h-2.5 w-2.5 rounded-full",
              i <= v ? "bg-brand" : "bg-gray-200",
            ].join(" ")}
          />
        ))}
      </span>
    </div>
  );
}

// 책 온도계: 난이도 / 감성 / 두께
export default function Thermometer({
  difficulty,
  emotion,
  thickness,
}: ThermometerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl2 bg-brand-soft/60 px-4 py-3">
      <Row label="난이도" value={difficulty} />
      <Row label="감성" value={emotion} />
      <Row label="두께" value={thickness} />
    </div>
  );
}
