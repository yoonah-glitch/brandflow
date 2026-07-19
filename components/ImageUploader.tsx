"use client";

import { useCallback, useRef, useState } from "react";

export type ItemStatus = "pending" | "processing" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  status: ItemStatus;
  progress: number; // 0~100 (processing 중)
  cutoutUrl?: string | null;
  error?: string;
}

export type OverallStatus = "idle" | "extracting" | "ready" | "error";

interface ImageUploaderProps {
  items: UploadItem[];
  overallStatus: OverallStatus;
  globalError: string | null;
  onFiles: (files: File[]) => void;
  onRetryItem: (id: string) => void;
  onReset: () => void;
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "대기 중",
  processing: "배경 제거 중",
  done: "완료",
  error: "실패",
};

export default function ImageUploader({
  items,
  overallStatus,
  globalError,
  onFiles,
  onRetryItem,
  onReset,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const hasItems = items.length > 0;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="w-full space-y-4">
      {/* 드롭존 */}
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
          hasItems ? "px-6 py-6" : "px-6 py-14"
        } ${
          dragActive
            ? "border-ink bg-neutral-100"
            : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50"
        }`}
      >
        <svg
          width={hasItems ? 26 : 40}
          height={hasItems ? 26 : 40}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-2 text-neutral-400"
        >
          <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-ink sm:text-base">
          {hasItems ? "사진 더 추가하기" : "작업물 사진을 드래그하거나 클릭해서 업로드"}
        </p>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          여러 장 한꺼번에 올릴 수 있어요 · 명함, 로고 등 · PNG / JPG / WEBP
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* 업로드 목록 */}
      {hasItems && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {overallStatus === "extracting"
                ? `배경 제거 중… (${doneCount}/${items.length})`
                : `사진 ${items.length}장 · 완료 ${doneCount}장`}
            </p>
            <button
              onClick={onReset}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              전체 초기화
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[conic-gradient(#f3f3f3_90deg,#fff_90deg_180deg,#f3f3f3_180deg_270deg,#fff_270deg)] bg-[length:12px_12px]">
                  {item.cutoutUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cutoutUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        item.status === "processing"
                          ? "animate-spin border-ink border-t-transparent"
                          : item.status === "error"
                            ? "border-red-400"
                            : "border-neutral-300"
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink">{item.name}</p>
                  <p
                    className={`text-[11px] ${
                      item.status === "done"
                        ? "text-green-700"
                        : item.status === "error"
                          ? "text-red-600"
                          : "text-neutral-500"
                    }`}
                  >
                    {item.status === "error"
                      ? (item.error ?? "실패")
                      : STATUS_LABEL[item.status]}
                  </p>
                  {item.status === "error" && (
                    <button
                      onClick={() => onRetryItem(item.id)}
                      className="mt-0.5 text-[11px] font-medium text-ink underline"
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
