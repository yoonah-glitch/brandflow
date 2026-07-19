"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ImageUploader, { type UploadStatus } from "@/components/ImageUploader";
import MoodSelector from "@/components/MoodSelector";
import RatioSelector from "@/components/RatioSelector";
import ResultGrid from "@/components/ResultGrid";
import type { MoodKey, RatioKey } from "@/lib/backgrounds";
import { compositeAll, type CompositeResult } from "@/lib/canvasUtils";
import {
  isBrowserSupported,
  isImageFile,
  resizeImageFile,
} from "@/lib/imageUtils";

// imgly 모델 에셋을 자체 호스팅(public/models)에서 로드하기 위한 publicPath.
// 필요 시 NEXT_PUBLIC_IMGLY_PUBLIC_PATH 로 재정의 가능(예: CDN).
function resolvePublicPath(): string {
  const override = process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH;
  if (override) return override;
  return new URL("/models/", window.location.origin).toString();
}

export default function Home() {
  const [supported, setSupported] = useState(true);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  const [mood, setMood] = useState<MoodKey | null>(null);
  const [ratio, setRatio] = useState<RatioKey>("1:1");

  const [results, setResults] = useState<CompositeResult[]>([]);
  const [generating, setGenerating] = useState(false);

  const lastFileRef = useRef<File | null>(null);

  useEffect(() => {
    setSupported(isBrowserSupported());
  }, []);

  // 업로드 → 리사이즈 → 누끼 추출 파이프라인
  const processFile = useCallback(async (file: File) => {
    if (!isImageFile(file)) {
      setStatus("error");
      setError("이미지 파일만 업로드 가능해요");
      return;
    }

    lastFileRef.current = file;
    setError(null);
    setCutoutBlob(null);

    // 이전 미리보기 URL 정리
    setCutoutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      // 1) 최대 2000px 리사이즈
      setStatus("resizing");
      setProgress(0);
      const resized = await resizeImageFile(file);

      // 2) 누끼 추출 (dynamic import, 클라이언트 전용)
      setStatus("removing");
      setProgress(0);

      const { removeBackground } = await import(
        "@imgly/background-removal"
      );

      const blob = await removeBackground(resized, {
        publicPath: resolvePublicPath(),
        output: { format: "image/png" },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            setProgress(Math.min(100, Math.round((current / total) * 100)));
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setCutoutBlob(blob);
      setCutoutUrl(url);
      setStatus("ready");
      setProgress(100);
    } catch (err) {
      console.error("배경 제거 실패:", err);
      setStatus("error");
      setError("배경 제거에 실패했어요. 다시 시도해주세요");
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastFileRef.current) {
      void processFile(lastFileRef.current);
    }
  }, [processFile]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setCutoutBlob(null);
    setCutoutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    lastFileRef.current = null;
  }, []);

  // 누끼/무드/비율이 준비되면 4개 배경에 합성
  useEffect(() => {
    if (!cutoutBlob || !mood) {
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });
      return;
    }

    let cancelled = false;
    setGenerating(true);

    compositeAll(cutoutBlob, mood, ratio)
      .then((next) => {
        if (cancelled) {
          next.forEach((r) => URL.revokeObjectURL(r.url));
          return;
        }
        setResults((prev) => {
          prev.forEach((r) => URL.revokeObjectURL(r.url));
          return next;
        });
      })
      .catch((err) => {
        console.error("합성 실패:", err);
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cutoutBlob, mood, ratio]);

  const showEditor = status === "ready" && !!cutoutBlob;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium tracking-wide text-neutral-500">
          BRANDFLOW
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          인스타그램 게시물 생성기
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          작업물 사진의 배경을 자동으로 제거하고, 무드에 맞는 배경에 합성해
          바로 올릴 이미지를 만들어드려요.
        </p>
      </header>

      {!supported && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          현재 브라우저에서는 배경 제거 기능이 지원되지 않아요. 최신 버전의
          Chrome, Edge, Safari, Firefox 에서 이용해주세요.
        </div>
      )}

      <div className={supported ? "space-y-10" : "pointer-events-none opacity-50 space-y-10"}>
        {/* STEP 1: 업로드 */}
        <section>
          <SectionTitle step={1} title="작업물 업로드" />
          <ImageUploader
            status={status}
            progress={progress}
            previewUrl={cutoutUrl}
            error={error}
            onFile={processFile}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </section>

        {/* STEP 2: 무드 선택 */}
        <section className={showEditor ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={2} title="무드 선택" />
          <MoodSelector
            selected={mood}
            onSelect={setMood}
            disabled={!showEditor}
          />
        </section>

        {/* STEP 3: 비율 선택 */}
        <section className={showEditor ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={3} title="인스타그램 비율" />
          <RatioSelector
            selected={ratio}
            onSelect={setRatio}
            disabled={!showEditor}
          />
        </section>

        {/* STEP 4: 결과 */}
        {showEditor && mood && (
          <section>
            <SectionTitle step={4} title="결과 이미지" />
            {generating || results.length > 0 ? (
              <ResultGrid
                results={results}
                mood={mood}
                ratio={ratio}
                generating={generating}
              />
            ) : (
              <p className="text-sm text-neutral-500">
                무드를 선택하면 4개의 이미지가 생성돼요.
              </p>
            )}
          </section>
        )}
      </div>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
        모든 처리는 브라우저 안에서 이루어지며, 이미지는 서버로 전송되지
        않습니다.
      </footer>
    </main>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
        {step}
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
    </div>
  );
}
