"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageUploader, {
  type UploadItem,
  type ItemStatus,
  type OverallStatus,
} from "@/components/ImageUploader";
import MoodSelector from "@/components/MoodSelector";
import SizeSelector from "@/components/SizeSelector";
import ResultGrid from "@/components/ResultGrid";
import AiBackgroundPanel, { type AiStatus } from "@/components/AiBackgroundPanel";
import type { MoodKey } from "@/lib/backgrounds";
import {
  compositeAll,
  compositeOnImages,
  compositeBatchScenes,
  compositeBatchOnImages,
  type OutImage,
} from "@/lib/canvasUtils";
import { generateAiBackgrounds } from "@/lib/aiBackground";
import { DEFAULT_SIZE } from "@/lib/sizes";
import { isBrowserSupported, isImageFile, resizeImageFile } from "@/lib/imageUtils";

// imgly 모델 경로. 프로덕션(.env.production)=CDN, 로컬 dev=self-host(/models/).
function resolvePublicPath(): string {
  const override = process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH;
  if (override) return override;
  return new URL("/models/", window.location.origin).toString();
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

type BgMode = "preset" | "ai";

interface Item extends UploadItem {
  file: File;
  cutout?: Blob;
}

export default function Home() {
  const [supported, setSupported] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [overall, setOverall] = useState<OverallStatus>("idle");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [bgMode, setBgMode] = useState<BgMode>("preset");
  const [mood, setMood] = useState<MoodKey | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBgBlobs, setAiBgBlobs] = useState<Blob[] | null>(null);

  const [size, setSize] = useState(DEFAULT_SIZE);

  const [results, setResults] = useState<OutImage[]>([]);
  const [generating, setGenerating] = useState(false);

  const itemsRef = useRef<Item[]>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    setSupported(isBrowserSupported());
  }, []);

  const syncItems = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<Item>) => {
      syncItems(itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    [syncItems]
  );

  // 대기 중인 항목을 순차적으로 배경 제거
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setOverall("extracting");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const publicPath = resolvePublicPath();

      while (true) {
        const next = itemsRef.current.find((i) => i.status === "pending");
        if (!next) break;

        updateItem(next.id, { status: "processing", progress: 0 });
        try {
          const resized = await resizeImageFile(next.file);
          const blob = await removeBackground(resized, {
            publicPath,
            output: { format: "image/png" },
            progress: (_k: string, c: number, t: number) => {
              if (t > 0) updateItem(next.id, { progress: Math.min(100, Math.round((c / t) * 100)) });
            },
          });
          updateItem(next.id, {
            status: "done",
            progress: 100,
            cutout: blob,
            cutoutUrl: URL.createObjectURL(blob),
          });
        } catch (err) {
          console.error("배경 제거 실패:", err);
          updateItem(next.id, { status: "error", error: "배경 제거 실패" });
        }
      }
    } finally {
      processingRef.current = false;
      const list = itemsRef.current;
      setOverall(
        list.some((i) => i.status === "done")
          ? "ready"
          : list.some((i) => i.status === "error")
            ? "error"
            : "idle"
      );
    }
  }, [updateItem]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter(isImageFile);
      setGlobalError(valid.length < files.length ? "이미지 파일만 업로드 가능해요" : null);
      if (valid.length === 0) return;

      const newItems: Item[] = valid.map((file) => ({
        id: uid(),
        name: file.name,
        file,
        status: "pending" as ItemStatus,
        progress: 0,
      }));
      syncItems([...itemsRef.current, ...newItems]);
      void processQueue();
    },
    [processQueue, syncItems]
  );

  const handleRetryItem = useCallback(
    (id: string) => {
      updateItem(id, { status: "pending", error: undefined });
      void processQueue();
    },
    [processQueue, updateItem]
  );

  const handleReset = useCallback(() => {
    itemsRef.current.forEach((i) => i.cutoutUrl && URL.revokeObjectURL(i.cutoutUrl));
    syncItems([]);
    setOverall("idle");
    setGlobalError(null);
  }, [syncItems]);

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

  const doneItems = useMemo(
    () => items.filter((i) => i.status === "done" && i.cutout),
    [items]
  );
  const doneKey = doneItems.map((i) => i.id).join(",");

  // 합성: 완료된 누끼 + (무드|AI) + 사이즈 → 결과
  useEffect(() => {
    const clear = () =>
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });

    const done = itemsRef.current.filter((i) => i.status === "done" && i.cutout);
    if (done.length === 0) {
      clear();
      return;
    }
    if (overall !== "ready") return; // 추출이 끝날 때까지 대기
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
      const single = done.length === 1;
      const batch = done.map((i) => ({ id: i.id, name: i.name, cutout: i.cutout! }));

      const task: Promise<OutImage[]> =
        bgMode === "ai"
          ? single
            ? compositeOnImages(done[0].cutout!, aiBgBlobs!, size.width, size.height)
            : compositeBatchOnImages(batch, aiBgBlobs!, size.width, size.height)
          : single
            ? compositeAll(done[0].cutout!, mood!, size.width, size.height)
            : compositeBatchScenes(batch, mood!, size.width, size.height);

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
    // doneKey 로 완료 집합 변화만 감지 (진행률 갱신에는 재실행 안 함)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overall, doneKey, bgMode, mood, aiBgBlobs, size.width, size.height]);

  const hasCutout = doneItems.length > 0;
  const hasBg =
    (bgMode === "preset" && !!mood) || (bgMode === "ai" && !!aiBgBlobs && aiBgBlobs.length > 0);
  const multiple = doneItems.length > 1;

  const uploadItems: UploadItem[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    status: i.status,
    progress: i.progress,
    cutoutUrl: i.cutoutUrl,
    error: i.error,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-medium tracking-wide text-neutral-500">BRANDFLOW</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          소셜 게시물 이미지 생성기
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          작업물 여러 장을 한꺼번에 올리면, 배경을 자동 제거하고 무드·AI 배경에 입체감 있게
          합성해 한 번에 만들어드려요.
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
          <SectionTitle step={1} title="작업물 업로드 (여러 장 가능)" />
          <ImageUploader
            items={uploadItems}
            overallStatus={overall}
            globalError={globalError}
            onFiles={handleFiles}
            onRetryItem={handleRetryItem}
            onReset={handleReset}
          />
        </section>

        {/* STEP 2 : 배경 */}
        <section className={hasCutout ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={2} title="배경 선택" />

          <div className="mb-4 inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1">
            <button
              type="button"
              disabled={!hasCutout}
              onClick={() => setBgMode("preset")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                bgMode === "preset" ? "bg-white text-ink shadow-sm" : "text-neutral-500"
              }`}
            >
              무드 프리셋
            </button>
            <button
              type="button"
              disabled={!hasCutout}
              onClick={() => setBgMode("ai")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                bgMode === "ai" ? "bg-white text-ink shadow-sm" : "text-neutral-500"
              }`}
            >
              ✨ AI 배경
            </button>
          </div>

          {bgMode === "preset" ? (
            <MoodSelector selected={mood} onSelect={setMood} disabled={!hasCutout} />
          ) : (
            <AiBackgroundPanel
              prompt={aiPrompt}
              onPromptChange={setAiPrompt}
              onGenerate={handleGenerateAi}
              status={aiStatus}
              error={aiError}
              disabled={!hasCutout}
            />
          )}

          {multiple && hasBg && (
            <p className="mt-3 text-xs text-neutral-500">
              여러 장을 올려서 각 사진당 1개씩 생성됩니다. (한 장만 올리면 4가지 스타일 변형)
            </p>
          )}
        </section>

        {/* STEP 3 */}
        <section className={hasCutout ? "" : "pointer-events-none opacity-40"}>
          <SectionTitle step={3} title="사이즈 선택" />
          <SizeSelector
            width={size.width}
            height={size.height}
            onChange={(width, height) => setSize({ width, height })}
            disabled={!hasCutout}
          />
        </section>

        {/* STEP 4 */}
        {hasCutout && hasBg && (
          <section>
            <SectionTitle step={4} title="결과 이미지" />
            {generating || results.length > 0 ? (
              <ResultGrid
                results={results}
                width={size.width}
                height={size.height}
                generating={generating}
                count={multiple ? doneItems.length : 4}
              />
            ) : (
              <p className="text-sm text-neutral-500">배경을 선택하면 이미지가 생성돼요.</p>
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
