"use client";

import { useState } from "react";
import JSZip from "jszip";
import type { OutImage } from "@/lib/canvasUtils";

interface ResultGridProps {
  results: OutImage[];
  width: number;
  height: number;
  generating?: boolean;
  count?: number; // 스켈레톤 개수
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ResultGrid({
  results,
  width,
  height,
  generating,
  count = 4,
}: ResultGridProps) {
  const aspect = `${width} / ${height}`;
  const [zipping, setZipping] = useState(false);

  const downloadAll = async () => {
    if (results.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      results.forEach((r) => zip.file(r.filename, r.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "brandflow_images.zip");
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setZipping(false);
    }
  };

  if (generating) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
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
    <div className="space-y-4">
      {results.length > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{results.length}장 생성됨</p>
          <button
            onClick={downloadAll}
            disabled={zipping}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {zipping ? "압축 중…" : `전체 다운로드 (ZIP · ${results.length}장)`}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {results.map((result) => (
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
                alt={result.filename}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5">
              <span className="truncate text-xs text-neutral-500">{result.filename}</span>
              <button
                onClick={() => triggerDownload(result.url, result.filename)}
                className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                다운로드
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
