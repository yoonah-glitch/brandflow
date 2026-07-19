"use client";

import { useCallback, useRef, useState } from "react";

export type UploadStatus =
  | "idle"
  | "resizing"
  | "removing"
  | "ready"
  | "error";

interface ImageUploaderProps {
  status: UploadStatus;
  progress: number; // 0 ~ 100
  previewUrl: string | null;
  error: string | null;
  onFile: (file: File) => void;
  onRetry: () => void;
  onReset: () => void;
}

export default function ImageUploader({
  status,
  progress,
  previewUrl,
  error,
  onFile,
  onRetry,
  onReset,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const isBusy = status === "resizing" || status === "removing";
  const hasPreview = !!previewUrl && (status === "ready" || isBusy);

  return (
    <div className="w-full">
      {!hasPreview && status !== "error" && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            dragActive
              ? "border-ink bg-neutral-100"
              : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50"
          }`}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-4 text-neutral-400"
          >
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
          </svg>
          <p className="text-base font-medium text-ink">
            작업물 사진을 드래그하거나 클릭해서 업로드
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            명함, 로고 등 · PNG / JPG / WEBP
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // 같은 파일 재선택 허용
          e.target.value = "";
        }}
      />

      {/* 미리보기 + 진행 상태 */}
      {hasPreview && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="relative mx-auto flex max-w-xs items-center justify-center overflow-hidden rounded-xl bg-[conic-gradient(#f3f3f3_90deg,#fff_90deg_180deg,#f3f3f3_180deg_270deg,#fff_270deg)] bg-[length:20px_20px] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="누끼 미리보기"
              className="max-h-64 w-auto object-contain"
            />
          </div>

          {isBusy && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-sm text-neutral-600">
                <span>
                  {status === "resizing"
                    ? "이미지 준비 중…"
                    : "배경 제거 중…"}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-ink transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === "ready" && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-green-700">
                ✓ 배경 제거 완료
              </p>
              <button
                onClick={onReset}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                다른 사진 업로드
              </button>
            </div>
          )}
        </div>
      )}

      {/* 에러 상태 */}
      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {error ?? "오류가 발생했어요."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={onRetry}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              다시 시도
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              다른 사진 업로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
