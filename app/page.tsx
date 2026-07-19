"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ImageUploader, { type UploadStatus } from "@/components/ImageUploader";
import MoodSelector from "@/components/MoodSelector";
import SizeSelector from "@/components/SizeSelector";
import ResultGrid from "@/components/ResultGrid";
import AiBackgroundPanel, { type AiStatus } from "@/components/AiBackgroundPanel";
import type { MoodKey } from "@/lib/backgrounds";
import { compositeAll, compositeOnImages, type CompositeResult } from "@/lib/canvasUtils";
import { generateAiBackgrounds } from "@/lib/aiBackground";
import { DEFAULT_SIZE } from "@/lib/sizes";
import { isBrowserSupported, isImageFile, resizeImageFile } from "@/lib/imageUtils";

// imgly 모델 경로. 프로덕션(.env.production)=CDN, 로컬 dev=self-host(/models/).
function resolvePublicPath(): string {
  const override = process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH;
  if (override) return override;
  return new URL("/models/", window.location.origin).toString();
}

type BgMode = "preset" | "ai";

export default function Home() {
  const [supported, setSupported] = useState(true);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  const [bgMode, setBgMode] = useState<BgMode>("preset");
  const [mood, setMood] = useState<MoodKey | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBgBlobs, setAiBgBlobs] = useState<Blob[] | null>(null);

  const [size, setSize] = useState(DEFAULT_SIZE);

  const [results, setResults] = useState<CompositeResult[]>([]);
  const [generating, setGenerating] = useState(false);

  const lastFileRef = useRef<File | null>(null);

  useEffect(() => {
    setSupported(isBrowserSupported());
  }, []);

  // 업로드 → 리사이즈 → 누끼 추출
  const processFile = useCallback(async (file: File) => {
    if (!isImageFile(file)) {
      setStatus("error");
      setError("이미지 파일만 업로드 가능해요");
      return;
    }

    lastFileRef.current = file;
    setError(null);
    setCutoutBlob(null);
    setCutoutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      setStatus("resizing");
      setProgress(0);
      const resized = await resizeImageFile(file);

      setStatus("removing");
      setProgress(0);

      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(resized, {
        publicPath: resolvePublicPath(),
        output: { format: "image/png" },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.min(100, Math.round((current / total) * 100)));
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
    if (lastFileRef.current) void processFile(lastFileRef.current);
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

  // AI 배경 생성 트리거
  const handleGenerateAi = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiStatus("loading");
    setAiError(null);
    try {
      const blobs = await generateAiBackgrounds(aiPrompt.trim(), size.width, size.height);
      setAiBgBlobs(blobs);
      setAiStatus("ready");
    } catch (err) {
      console.error("AI 배경 생성 실패:", err);
      setAiError((err as Error)?.message ?? "AI 배경 생성에 실패했어요.");
      setAiStatus("error");
    }
  }, [aiPrompt, size.width, size.height]);

  // 누끼 + (프리셋 무드 | AI 배경) + 사이즈 → 4장 합성 (사이즈 변경은 디바운스)
  useEffect(() => {
    const clear = () =>
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });

    if (!cutoutBlob) {
      clear();
      return;
    }
    if (bgMode === "preset" && !mood) {
      clear();
      return;
    }
    if (bgMode === "ai" && (!aiBgBlobs || aiBgBlobs.length === 0)) {
      clear();
      return;
    }

    let cancelled = false;
    setGenerating(true);

    const timer = setTimeout(() => {
      const task =
        bgMode === "ai"
          ? compositeOnImages(cutoutBlob, aiBgBlobs!, size.width, size.height)
          : compositeAll(cutoutBlob, mood!, size.width, size.height);

      task
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
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cutoutBlob, bgMode, mood, aiBgBlobs, size.width, size.height]);

  const showEditor = status === "ready" && !!cutoutBlob;
  const hasBg =
    (bgMode === "preset" && !!mood) ||
    (bgMode === "ai" && !!aiBgBlobs && aiBgBlobs.length > 0);
  const namePrefix = bgMode === "ai" ? "ai" : mood ?? "bg";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium tracking-wide text-neutral-500">BRANDFLOW</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          소셜 게시물 이미지 생성기
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          작업물의 배경을 자동으로 제거하고, 무드 프리셋이나 AI로 만든 배경에 입체감 있게
          합성해 어디에든 올릴 이미지를 만들어드려요.
        </p>
      </header>

      {!supported && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          현재 브라우저에서는 배경 제거 기능이 지원되지 않아요. 최신 버전의 Chrome, Edge,
          Safari, Firefox 에서 이용해주세요.
        </div>
      )}

      <div className={supported ? "space-y-10" : "pointer-events-none space-y-10 opacity-50"}>
        {/* STEP 1 */}
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

        {/* STEP 2 : 배경 (프리셋 무드 / AI) */}
        <section className={showEditor ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={2} title="배경 선택" />

          <div className="mb-4 inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1">
            <button
              type="button"
              disabled={!showEditor}
              onClick={() => setBgMode("preset")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                bgMode === "preset" ? "bg-white text-ink shadow-sm" : "text-neutral-500"
              }`}
            >
              무드 프리셋
            </button>
            <button
              type="button"
              disabled={!showEditor}
              onClick={() => setBgMode("ai")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                bgMode === "ai" ? "bg-white text-ink shadow-sm" : "text-neutral-500"
              }`}
            >
              ✨ AI 배경
            </button>
          </div>

          {bgMode === "preset" ? (
            <MoodSelector selected={mood} onSelect={setMood} disabled={!showEditor} />
          ) : (
            <AiBackgroundPanel
              prompt={aiPrompt}
              onPromptChange={setAiPrompt}
              onGenerate={handleGenerateAi}
              status={aiStatus}
              error={aiError}
              disabled={!showEditor}
            />
          )}
        </section>

        {/* STEP 3 */}
        <section className={showEditor ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={3} title="사이즈 선택" />
          <SizeSelector
            width={size.width}
            height={size.height}
            onChange={(width, height) => setSize({ width, height })}
            disabled={!showEditor}
          />
        </section>

        {/* STEP 4 */}
        {showEditor && hasBg && (
          <section>
            <SectionTitle step={4} title="결과 이미지" />
            {generating || results.length > 0 ? (
              <ResultGrid
                results={results}
                namePrefix={namePrefix}
                width={size.width}
                height={size.height}
                generating={generating}
              />
            ) : (
              <p className="text-sm text-neutral-500">배경을 선택하면 4개의 이미지가 생성돼요.</p>
            )}
          </section>
        )}
      </div>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
        누끼 추출·합성은 브라우저에서 처리됩니다. AI 배경 사용 시에만 프롬프트가 서버를 거쳐
        이미지 생성 API로 전송됩니다.
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
