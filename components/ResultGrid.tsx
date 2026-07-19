"use client";

import type { CompositeResult } from "@/lib/canvasUtils";
import { buildFileName } from "@/lib/canvasUtils";
import type { MoodKey } from "@/lib/backgrounds";

interface ResultGridProps {
  results: CompositeResult[];
  mood: MoodKey;
  width: number;
  height: number;
  generating?: boolean;
}

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ResultGrid({
  results,
  mood,
  width,
  height,
  generating,
}: ResultGridProps) {
  const aspect = `${width} / ${height}`;

  if (generating) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-neutral-200"
            style={{ aspectRatio: aspect }}
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {results.map((result) => {
        const filename = buildFileName(mood, width, height, result.index);
        return (
          <div
            key={result.id}
            className="group overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <div
              className="flex items-center justify-center bg-neutral-50"
              style={{ aspectRatio: aspect }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt={`합성 결과 ${result.index}`}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5">
              <span className="truncate text-xs text-neutral-500">{filename}</span>
              <button
                onClick={() => download(result.url, filename)}
                className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                다운로드
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
