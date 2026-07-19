"use client";

export type AiStatus = "idle" | "loading" | "error" | "ready";

interface AiBackgroundPanelProps {
  prompt: string;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  status: AiStatus;
  error: string | null;
  disabled?: boolean;
}

const EXAMPLES = [
  "따뜻한 베이지 리넨 배경, 부드러운 아침 햇살",
  "짙은 대리석 테이블 위, 은은한 골드 조명",
  "파스텔 핑크 그라디언트, 몽환적인 분위기",
  "콘크리트 벽과 나무 바닥, 미니멀 스튜디오",
];

export default function AiBackgroundPanel({
  prompt,
  onPromptChange,
  onGenerate,
  status,
  error,
  disabled,
}: AiBackgroundPanelProps) {
  const loading = status === "loading";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink">원하는 배경을 설명해주세요</p>
      <p className="mt-1 text-xs text-neutral-500">
        분위기·색감·소재·조명을 적을수록 좋아요. 4장이 생성됩니다.
      </p>

      <textarea
        value={prompt}
        disabled={disabled || loading}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={3}
        placeholder="예: 따뜻한 베이지 리넨 배경에 부드러운 자연광"
        className="mt-3 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={disabled || loading}
            onClick={() => onPromptChange(ex)}
            className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] text-neutral-600 transition-colors hover:border-neutral-400 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || loading || prompt.trim().length === 0}
        onClick={onGenerate}
        className="mt-3 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "배경 생성 중… (최대 1분)" : "AI 배경 생성"}
      </button>

      {loading && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-ink" />
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error ?? "생성에 실패했어요."}</p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled}
            className="mt-2 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            다시 시도
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
