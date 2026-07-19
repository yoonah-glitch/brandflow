"use client";

import { useEffect, useState } from "react";
import {
  SIZE_PRESETS,
  clampDimension,
  matchPresetKey,
  MIN_DIMENSION,
  MAX_DIMENSION,
} from "@/lib/sizes";

interface SizeSelectorProps {
  width: number;
  height: number;
  onChange: (width: number, height: number) => void;
  disabled?: boolean;
}

// 프리셋을 그룹별로 묶기
const GROUPS = Array.from(new Set(SIZE_PRESETS.map((p) => p.group)));

export default function SizeSelector({
  width,
  height,
  onChange,
  disabled,
}: SizeSelectorProps) {
  const activeKey = matchPresetKey(width, height);

  // 커스텀 입력 필드는 문자열로 관리(타이핑 중 자유 입력 허용)
  const [wStr, setWStr] = useState(String(width));
  const [hStr, setHStr] = useState(String(height));

  // 외부(프리셋 클릭 등)에서 크기가 바뀌면 입력 필드도 동기화
  useEffect(() => {
    setWStr(String(width));
    setHStr(String(height));
  }, [width, height]);

  const commitCustom = (nextW: string, nextH: string) => {
    const w = clampDimension(parseInt(nextW, 10));
    const h = clampDimension(parseInt(nextH, 10));
    onChange(w, h);
  };

  return (
    <div className="space-y-5">
      {/* 프리셋 */}
      <div className="space-y-4">
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {group}
            </p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.filter((p) => p.group === group).map((p) => {
                const isActive = activeKey === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(p.width, p.height)}
                    aria-pressed={isActive}
                    className={`rounded-lg border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive
                        ? "border-ink bg-ink text-white"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <span className="block text-xs font-semibold">{p.label}</span>
                    <span
                      className={`block text-[11px] tabular-nums ${
                        isActive ? "text-white/70" : "text-neutral-400"
                      }`}
                    >
                      {p.width} × {p.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 커스텀 입력 */}
      <div
        className={`rounded-xl border p-4 ${
          activeKey === null
            ? "border-ink ring-2 ring-ink/10"
            : "border-neutral-200"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">직접 입력 (가로 × 세로)</p>
          {activeKey === null && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
              커스텀
            </span>
          )}
        </div>
        <div className="flex items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-neutral-500">가로 (px)</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={wStr}
              disabled={disabled}
              onChange={(e) => setWStr(e.target.value)}
              onBlur={() => commitCustom(wStr, hStr)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustom(wStr, hStr);
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-ink disabled:opacity-50"
            />
          </label>
          <span className="pb-2 text-neutral-400">×</span>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-neutral-500">세로 (px)</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={hStr}
              disabled={disabled}
              onChange={(e) => setHStr(e.target.value)}
              onBlur={() => commitCustom(wStr, hStr)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustom(wStr, hStr);
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-ink disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => commitCustom(wStr, hStr)}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            적용
          </button>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          {MIN_DIMENSION}~{MAX_DIMENSION}px 범위. Enter 또는 적용을 누르면 반영됩니다.
        </p>
      </div>
    </div>
  );
}
