"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Eye,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FileDropzone,
  type UploadedFile,
} from "./file-dropzone";
import { WaveDots } from "./wave-dots";
import { useGenerationSubscription } from "@/lib/hooks/use-generation-subscription";
import {
  titleOptionsFrom,
  type GenerationRecord,
} from "@/lib/types/generation";
import { cn } from "@/lib/utils";
import { MAX_IDEATE_RETRIES } from "@/lib/ideate/constants";

export function HumanCheckpoint({
  generation: initial,
  onGenerationChange,
  onDeliverable,
}: {
  generation: GenerationRecord;
  onGenerationChange?: (
    next: GenerationRecord
  ) => void;
  onDeliverable?: (
    url: string,
    record: GenerationRecord
  ) => void;
}) {
  const {
    generation,
    setGeneration,
    status,
    finalImageUrl,
    isProcessing,
    isCompleted,
    isFailed,
  } = useGenerationSubscription(
    initial.id,
    initial,
    initial.user_id
  );

  const record = generation ?? initial;
  const isFrameWorkflow = record.workflow === "FRAME";
  const titles = titleOptionsFrom(record);

  const stagingObj =
    record.asset_staging_instructions as any;

  const strategy =
    stagingObj?._ai_strategy || {};

  const rawAssets: any[] = Array.isArray(
    stagingObj?.assets
  )
    ? stagingObj.assets
    : stagingObj?.requestedAssets ?? [];

  // v36: every workflow exposes exactly three positional staging slots.
  // Older generations are padded locally so the checkpoint/render contract
  // remains stable without rewriting their saved strategy.
  const assets: any[] = Array.from({ length: 3 }, (_, index) =>
    rawAssets[index] ?? {
      asset_name: `AI-generated supporting asset ${index + 1}`,
      required: false,
      asset_type: "prop",
      how_to_shoot:
        "Generate a photorealistic supporting asset specific to the visual concept.",
      placement_in_thumbnail:
        `Use Slot ${index + 1} according to the visual concept.`,
      purpose:
        "Fill the fixed three-slot visual composition when no upload is provided.",
    }
  );

  const [
    aiGeneratedSlots,
    setAiGeneratedSlots,
  ] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      Object.entries(record.ai_generated_slots ?? {}).map(([key, value]) => [
        Number(key),
        Boolean(value),
      ])
    )
  );

  const [
    selectedTitle,
    setSelectedTitle,
  ] = useState<string | null>(
    record.selected_title ?? titles[0] ?? null
  );

  // Global checkpoint preference: ON by default for new generations.
  // An explicitly persisted OFF value is preserved when the user has
  // intentionally disabled AI generation for an existing generation.
  // that are still missing. Uploaded files always remain user-supplied.
  const [generateWithAI, setGenerateWithAI] = useState<boolean>(
    record.generate_with_ai ?? true
  );

  /*
   * IMPORTANT:
   * Keep assetFiles indexed by the REAL asset index.
   *
   * Example:
   * assets = [asset0, asset1, asset2]
   * asset1 = AI generated
   *
   * assetFiles remains:
   * [fileForAsset0, null, fileForAsset2]
   *
   * This prevents AI-generated slots from shifting
   * the uploaded asset indexes.
   */
  const [assetFiles, setAssetFiles] = useState<
    Array<UploadedFile | null>
  >(() => {
    /*
     * Reference thumbnails live in generation.inspiration_urls and are never
     * inferred from staging asset slots. For staging assets, prefer the new
     * explicit sparse slot map when available. Older generations fall back to
     * the legacy compact asset_urls representation used by v26.
     */
    const slotUrls = (record as any).asset_slot_urls;
    if (Array.isArray(slotUrls) && slotUrls.length === assets.length) {
      return slotUrls.map((url: string | null) =>
        url
          ? ({
              url, path: url, preview: url, name: "Saved asset",
              size: 0, type: "image/*",
            } as UploadedFile)
          : null
      );
    }

    const legacyUrls = record.asset_urls ?? [];
    return Array.from({ length: 3 }, (_, index) => {
      const url = legacyUrls[index] ?? null;
      return url
        ? ({
            url, path: url, preview: url, name: "Saved asset",
            size: 0, type: "image/*",
          } as UploadedFile)
        : null;
    });
  });

  const assetFilesRef = useRef<Array<UploadedFile | null>>(assetFiles);

  useEffect(() => {
    assetFilesRef.current = assetFiles;
  }, [assetFiles]);

  const aiGeneratedSlotsRef = useRef<Record<number, boolean>>(aiGeneratedSlots);

  useEffect(() => {
    aiGeneratedSlotsRef.current = aiGeneratedSlots;
  }, [aiGeneratedSlots]);

  const [retrying, setRetrying] =
    useState(false);

  const [assetUploadsActive, setAssetUploadsActive] =
    useState(false);
  const assetUploadsActiveRef = useRef(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [progressSaveState, setProgressSaveState] =
    useState<"idle" | "saving" | "saved" | "error">("idle");

  const deliveredRef =
    useRef(false);

  /*
   * Serialize checkpoint writes from this component. Without a queue, a title
   * change and an asset/toggle change can arrive at the API out of order and
   * the older full asset snapshot can overwrite the newer one.
   */
  const progressQueueRef = useRef(
    Promise.resolve()
  );

  const checkpointDraftRef = useRef<Record<string, unknown> | null>(null);

  function queueProgressSave(
    payload: Record<string, unknown>
  ) {
    checkpointDraftRef.current = payload;
    setProgressSaveState("saving");

    const saveOperation = progressQueueRef.current
      .catch(() => {})
      .then(async () => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const response = await fetch(
              "/api/generations/progress",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }
            );

            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(
                data.error ?? "Could not save generation progress"
              );
            }

            setProgressSaveState("saved");
            return;
          } catch (error) {
            lastError =
              error instanceof Error
                ? error
                : new Error("Could not save generation progress");

            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        setProgressSaveState("error");
        console.error(
          "[checkpoint] Could not save generation progress after retry",
          lastError
        );
        throw lastError ?? new Error("Could not save generation progress");
      });

    // Keep the queue itself non-rejecting so one failed save never poisons the
    // next checkpoint write. Callers that need a durable barrier can await the
    // returned saveOperation and receive the real failure.
    progressQueueRef.current = saveOperation.catch(() => {});
    return saveOperation;
  }

  useEffect(() => {
    if (generation) {
      onGenerationChange?.(generation);
    }
  }, [
    generation,
    onGenerationChange,
  ]);

  useEffect(() => {
    setGenerateWithAI(record.generate_with_ai ?? true);

    const persisted = record.ai_generated_slots ?? {};
    setAiGeneratedSlots(
      Object.fromEntries(
        Object.entries(persisted).map(([key, value]) => [
          Number(key),
          Boolean(value),
        ])
      )
    );
  }, [record.id, record.generate_with_ai, JSON.stringify(record.ai_generated_slots)]);

  /*
   * Title selection is locally authoritative while this checkpoint is open.
   *
   * Supabase Realtime + HTTP polling can deliver snapshots out of order. The
   * old implementation listened to `record.selected_title` and could therefore
   * do this:
   *
   *   user selects B -> save(B) is queued
   *   stale realtime/poll snapshot says A -> local UI switches back to A
   *   save(A) is queued -> the user's latest choice can be overwritten
   *
   * Only synchronize from the record when the generation itself changes or the
   * title list changes (which represents a new/re-ideated concept). A remote
   * selected_title update for the same title list must never overwrite the
   * user's current local click.
   */
  const titleSyncRef = useRef<{
    generationId: string | null;
    titlesKey: string;
  }>({
    generationId: null,
    titlesKey: "",
  });

  const titlesKey = JSON.stringify(titles);

  useEffect(() => {
    const generationChanged =
      titleSyncRef.current.generationId !== record.id;
    const titlesChanged =
      titleSyncRef.current.titlesKey !== titlesKey;

    if (!generationChanged && !titlesChanged) {
      return;
    }

    titleSyncRef.current = {
      generationId: record.id,
      titlesKey,
    };

    // A new/re-ideated title list always starts from the first title unless
    // the same generation is being hydrated for the very first time and the
    // database already contains a persisted selection.
    const nextTitle = generationChanged
      ? record.selected_title ?? titles[0] ?? null
      : titles[0] ?? null;

    setSelectedTitle(nextTitle);
  }, [record.id, titlesKey, record.selected_title, titles]);

  useEffect(() => {
    if (
      !record.id ||
      !selectedTitle ||
      !["PENDING", "CHECKPOINT"].includes(status) ||
      record.selected_title === selectedTitle
    ) {
      return;
    }

    void queueProgressSave({
      generationId: record.id,
      selectedTitle,
    });
  }, [record.id, selectedTitle, record.selected_title, status]);

  // Best-effort final checkpoint flush for normal tab closes/navigation.
  // Hard process termination can still interrupt JavaScript; the server-side
  // 24-hour resume contract remains the ultimate fallback.
  useEffect(() => {
    if (!record.id || !["PENDING", "CHECKPOINT"].includes(status)) return;

    const handlePageHide = () => {
      const draft = checkpointDraftRef.current;
      if (!draft || typeof navigator === "undefined" || !navigator.sendBeacon) return;
      try {
        const blob = new Blob([JSON.stringify(draft)], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/generations/progress", blob);
      } catch (error) {
        console.warn("[checkpoint] Final beacon save failed:", error);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [record.id, status]);

  useEffect(() => {
    if (
      deliveredRef.current ||
      !isCompleted ||
      !finalImageUrl
    ) {
      return;
    }

    deliveredRef.current = true;

    onDeliverable?.(
      finalImageUrl,
      record
    );
  }, [
    isCompleted,
    finalImageUrl,
    record,
    onDeliverable,
  ]);

  /*
   * All three positional slots remain uploadable even when AI mode is ON.
   * A user upload always takes precedence over AI for that slot.
   */
  const uploadableIndices = assets.map((_, index) => index);

  const manualUploadCount =
    uploadableIndices.length;

  /*
   * Convert our real asset-indexed files into the
   * compact array expected by FileDropzone.
   */
  const uploadFilesForDropzone =
    uploadableIndices.map(
      (assetIndex) =>
        assetFiles[assetIndex] ?? null
    );

  /*
   * The checkpoint can proceed when either:
   *
   * 1. Generate with AI is ON, so missing staging slots will be generated; OR
   * 2. all three positional slots have user-uploaded assets.
   *
   * Existing per-slot AI flags are retained for backwards compatibility, but
   * new switch behavior is derived at render time from generateWithAI.
   */
  const allAssetsUploaded = assets.every((_, index) =>
    Boolean(assetFiles[index]?.url?.trim())
  );

  const isHumanAsset = (asset: any): boolean => {
    const type = String(asset?.asset_type ?? "").toLowerCase();
    const name = String(asset?.asset_name ?? asset?.asset ?? "").toLowerCase();
    const instructions = String(asset?.how_to_shoot ?? asset?.instructions ?? "").toLowerCase();
    return type === "creator" || type === "person" ||
      /\b(?:creator|human|person|face|man|woman|boy|girl|actor|character|friend|people|portrait)\b/i.test(name) ||
      /\b(?:creator|human|person|face|man|woman|boy|girl|actor|character|friend|people|portrait)\b/i.test(instructions);
  };

  const humanSlotIndexes = isFrameWorkflow
    ? []
    : assets.map((asset, index) => isHumanAsset(asset) ? index : -1).filter((index) => index >= 0);

  const humanRequirementSatisfied =
    record.workflow !== "ASSET" ||
    record.include_creator !== true ||
    humanSlotIndexes.some((index) =>
      Boolean(assetFiles[index]?.url?.trim()) ||
      (generateWithAI && !assetFiles[index]?.url?.trim())
    );

  // FileDropzone uses a temporary UploadedFile with url="" while a selected
  // asset is still uploading. AI mode intentionally allows genuinely empty
  // slots, but it must never treat an actively uploading slot as empty.
  const hasUploadingAssets = assetFiles.some(
    (file) => file !== null && !file.url?.trim()
  );

  const canRender =
    Boolean(selectedTitle) &&
    !submitting &&
    !hasUploadingAssets &&
    (status === "CHECKPOINT") &&
    humanRequirementSatisfied &&
    (isFrameWorkflow || generateWithAI || allAssetsUploaded);

  async function handleGenerateWithAIToggle() {
    const nextValue = !generateWithAI;
    setGenerateWithAI(nextValue);

    // Turning the switch OFF cancels any legacy per-slot AI delegation.
    // Turning it ON does not mark slots as auto-created yet; the render step
    // derives AI delegation only for slots that are still missing.
    const nextAiGeneratedSlots = nextValue
      ? aiGeneratedSlotsRef.current
      : {};

    aiGeneratedSlotsRef.current = nextAiGeneratedSlots;
    setAiGeneratedSlots(nextAiGeneratedSlots);

    await queueProgressSave({
      generationId: record.id,
      selectedTitle,
      generateWithAI: nextValue,
      assetUrls: assetFilesRef.current
        .map((file) => file?.url ?? null)
        .filter((url): url is string => Boolean(url)),
      assetSlotUrls: assets.map((_, index) =>
        assetFilesRef.current[index]?.url?.trim() || null
      ),
      aiGeneratedSlots: Object.fromEntries(
        Object.entries(nextAiGeneratedSlots).map(([key, value]) => [
          key,
          Boolean(value),
        ])
      ),
    });
  }

  async function handleRetry() {
    if (
      retriesLeft <= 0 ||
      retrying ||
      assetUploadsActiveRef.current
    ) {
      return;
    }

    setError(null);
    setRetrying(true);

    try {
      const res = await fetch(
        "/api/ideate/retry",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            generationId: record.id,
          }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error ??
            "Failed to re-ideate"
        );
      }

      if (data.generation) {
        const nextGeneration = data.generation as GenerationRecord;
        setGeneration(nextGeneration);
        const nextTitles = titleOptionsFrom(nextGeneration);
        setSelectedTitle(nextTitles[0] ?? null);
      } else {
        setSelectedTitle(null);
      }

      setAssetFiles([]);
      setAiGeneratedSlots({});
      setGenerateWithAI(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Re-ideation failed"
      );
    } finally {
      setRetrying(false);
    }
  }

  async function handleAssetFilesChange(
    files: Array<UploadedFile | null>
  ) {
    /*
     * Map compact FileDropzone indexes back into the actual asset indexes.
     * Build the next snapshot before saving so FileDropzone can wait for the
     * durable checkpoint write before deleting an old Storage object.
     */
    const next = [...assetFilesRef.current];

    uploadableIndices.forEach(
      (assetIndex, uploadIndex) => {
        next[assetIndex] =
          files[uploadIndex] ?? null;
      }
    );

    const assetUrls = assets.map(
      (_, assetIndex) =>
        next[assetIndex]?.url ?? null
    );

    // A real upload always wins for that slot. This also makes an upload
    // immediately replace a legacy one-shot AI delegation for the slot.
    const nextAiGeneratedSlots = { ...aiGeneratedSlotsRef.current };
    uploadableIndices.forEach((assetIndex) => {
      if (next[assetIndex]?.url) {
        nextAiGeneratedSlots[assetIndex] = false;
      }
    });

    aiGeneratedSlotsRef.current = nextAiGeneratedSlots;
    setAiGeneratedSlots(nextAiGeneratedSlots);
    assetFilesRef.current = next;
    setAssetFiles(next);

    await queueProgressSave({
      generationId: record.id,
      selectedTitle,
      generateWithAI,
      assetUrls: assetUrls.filter((url): url is string => Boolean(url)),
      assetSlotUrls: assetUrls.map((url) => url ?? ""),
      aiGeneratedSlots: Object.fromEntries(
        Object.entries(nextAiGeneratedSlots).map(([key, value]) => [
          key,
          Boolean(value),
        ])
      ),
    });
  }

  async function handleRender() {
    if (
      !canRender ||
      !selectedTitle
    ) {
      return;
    }

    // Defensive readiness check: FileDropzone creates a temporary file object
    // with url="" while an upload is still in progress. Never start a render
    // while any selected asset is still uploading, even when AI mode is ON.
    const currentAssetFiles = assetFilesRef.current;
    const hasCurrentUploadingAssets = currentAssetFiles.some(
      (file) => file !== null && !file.url?.trim()
    );

    if (hasCurrentUploadingAssets) {
      setError("Please wait for all selected assets to finish uploading.");
      return;
    }

    const currentAllAssetsUploaded = assets.every((_, index) =>
      Boolean(currentAssetFiles[index]?.url?.trim())
    );

    if (record.workflow === "ASSET" && record.include_creator === true) {
      const currentHumanSatisfied = humanSlotIndexes.some((index) =>
        Boolean(currentAssetFiles[index]?.url?.trim()) ||
        (generateWithAI && !currentAssetFiles[index]?.url?.trim())
      );
      if (!currentHumanSatisfied) {
        setError("Include Human is on. Upload a human asset or enable Generate with AI for the required human slot.");
        return;
      }
    }

    const uploadsReady =
      isFrameWorkflow ||
      generateWithAI ||
      currentAllAssetsUploaded;

    if (!uploadsReady) {
      setError("Please upload all required assets before rendering.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // A render is a durable checkpoint boundary. Do not let the UI state
      // race ahead of the last queued progress write.
      await progressQueueRef.current;
      /*
       * Preserve asset order when sending URLs.
       * AI-generated and optional-without-upload
       * slots simply contribute no URL.
       */
      // Preserve the real slot indexes across the render boundary.
      // Never compact this array: [Creator, null, Prop] must remain
      // [Creator, null, Prop] so the worker can keep Prop in slot #3.
      const assetSlotUrls = isFrameWorkflow
        ? [null, null, null]
        : assets.map((_, index) => {
            const url = assetFiles[index]?.url?.trim();
            return url ? url : null;
          });

      // Keep the compact list for backwards compatibility with older rows.
      // FRAME intentionally sends no staging assets.
      const assetUrls = assetSlotUrls.filter(
        (url): url is string => Boolean(url)
      );

      const res = await fetch(
        "/api/render",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            generationId: record.id,
            selectedTitle,
            assetUrls,
            assetSlotUrls,
            visualConcept:
              record.visual_concept ??
              undefined,
            // Send the current switch value with the render request itself.
            // Persistence through /api/generations/progress is still kept for
            // recovery, but rendering must not depend on that asynchronous save.
            generateWithAI,
          }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error ??
            "Could not start final render"
        );
      }

      if (data.generation) {
        setGeneration(
          data.generation as GenerationRecord
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start final render"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const retriesUsed =
    record.retry_count ?? 0;

  const retriesLeft = Math.max(
    0,
    MAX_IDEATE_RETRIES - retriesUsed
  );

  if (
    isCompleted &&
    finalImageUrl
  ) {
    return (
      <WaveDots label="Thumbnail ready" />
    );
  }

  if (isFailed) {
    const isOpenAiViolation = record.status === "FAILED_TOS";

    return (
      <div className="flex flex-col gap-3 py-6">
        <p className="text-sm font-medium text-destructive">
          {isOpenAiViolation
            ? "Your thumbnail caused an OpenAI policy violation."
            : "Rendering failed"}
        </p>

        <p className="text-sm text-zinc-500">
          {isOpenAiViolation
            ? "Click X to close. Your generation credit has been refunded."
            : generation?.render_error ||
              "You can try generating a new concept from the form, or re-ideate if attempts remain."}
        </p>
      </div>
    );
  }

  if (
    isProcessing ||
    retrying
  ) {
    return (
      <WaveDots
        label={
          retrying
            ? "Ideating..."
            : "Rendering..."
        }
      />
    );
  }

  const vc =
    strategy.visual_concept;
  const strategicHook =
    strategy.strategic_hook && typeof strategy.strategic_hook === "object"
      ? strategy.strategic_hook as Record<string, unknown>
      : {};
  const thumbnailStory =
    String(strategy.one_second_story ?? "").trim() ||
    "The thumbnail story will appear here once ideation is complete.";
  const thumbnailHook =
    String(
      strategicHook.mechanism_explanation ??
      strategicHook.curiosity_gap ??
      strategy.click_strategy ??
      ""
    ).trim() || "The click hook will appear here.";
  const thumbnailProof =
    String(
      strategicHook.visual_proof ??
      ""
    ).trim() || "The strongest visible proof will appear here.";
  const visualPlan =
    String(
      vc?.creator_summary ??
      vc?.composition_and_scale ??
      record.visual_concept ??
      ""
    ).trim() || "The visual plan will appear here.";

  return (
    <div className="flex flex-col gap-6">
      {progressSaveState !== "idle" && (
        <p
          className={cn(
            "text-xs",
            progressSaveState === "error"
              ? "text-destructive"
              : "text-zinc-500"
          )}
        >
          {progressSaveState === "saving" && "Saving your checkpoint changes…"}
          {progressSaveState === "saved" && "Checkpoint changes saved."}
          {progressSaveState === "error" &&
            "Couldn’t save the latest checkpoint change. Please try it again when your connection is stable."}
        </p>
      )}

      {/* 1. Creative decision summary */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">CREATIVE DECISION</p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
            Understand the thumbnail before you render it.
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["THUMBNAIL STORY", thumbnailStory],
            ["HOOK", thumbnailHook],
            ["PROOF", thumbnailProof],
            ["VISUAL PLAN", visualPlan],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-500">{label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-800 dark:text-zinc-200">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Viral Title Selector */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Choose a viral title{" "}
          <span className="text-destructive">
            *
          </span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          {titles.map((title) => {
            const selected =
              selectedTitle === title;

            return (
              <button
                key={title}
                type="button"
                onClick={() =>
                  setSelectedTitle(title)
                }
                className={cn(
                  "rounded-2xl border-2 p-4 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-red-500 bg-red-50/80 dark:bg-red-950/40"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  {title}

                  {selected && (
                    <Check className="mt-0.5 size-4 shrink-0 text-red-600" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Structured Visual Blueprint */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-red-500" />

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Visual Concept Blueprint
          </h3>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
          {vc?.creator_summary ? (
            <div className="space-y-3">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {vc.creator_summary}
              </p>

              <div className="grid gap-2 border-t border-zinc-200 pt-3 text-xs text-zinc-600 sm:grid-cols-2 dark:border-zinc-800 dark:text-zinc-400">
                <div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Attention Flow:{" "}
                  </span>

                  {vc.attention_priority}
                </div>

                <div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Scale & Layout:{" "}
                  </span>

                  {vc.composition_and_scale}
                </div>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {record.visual_concept ||
                "Generating visual blueprint..."}
            </p>
          )}
        </div>
      </section>

      {/* 4. Staging Guidance & Asset Uploads — not applicable to FRAME */}
      {!isFrameWorkflow && (
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-red-500" />

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Staging guidance & post-ideation assets
          </h3>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Generate with AI
              </p>
              <p className="text-[10px] text-zinc-500">
                {generateWithAI
                  ? "Missing assets will be created automatically"
                  : "Upload all 3 assets to continue"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={generateWithAI}
              aria-label="Generate missing assets with AI"
              onClick={() => void handleGenerateWithAIToggle()}
              disabled={submitting || isProcessing}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60",
                generateWithAI ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform",
                  generateWithAI ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {assets.length > 0 ? (
          <div className="space-y-2.5">
            {assets.map(
              (asset, i) => {
                const isAiGen =
                  Boolean(
                    aiGeneratedSlots[i]
                  );

                return (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white p-3.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                      <span className="flex items-center gap-1.5">
                        <span className="flex size-4 items-center justify-center rounded-full bg-red-100 text-[10px] text-red-600 dark:bg-red-950/80">
                          {i + 1}
                        </span>

                        {asset.asset_name ||
                          asset.asset ||
                          "Photo Requirement"}
                      </span>

                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          asset.required ===
                            false ||
                            isAiGen
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950/50"
                        )}
                      >
                        {isAiGen
                          ? "Auto-Created"
                          : asset.required ===
                              false
                            ? "Optional"
                            : "Required"}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
                      <p>
                        <strong>
                          Instructions:
                        </strong>{" "}
                        {asset.how_to_shoot ||
                          asset.instructions ||
                          "Standard shot"}
                      </p>

                      <p>
                        <strong>
                          Placement:
                        </strong>{" "}
                        {asset.placement_in_thumbnail ||
                          asset.position ||
                          "As directed"}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No extra photos were requested for this concept.
          </p>
        )}

        {manualUploadCount > 0 && (
          <FileDropzone
            variant="slots"
            maxFiles={manualUploadCount}
            bucket="style-anchors"
            pathPrefix={`${record.user_id}/screenshots`}
            files={uploadFilesForDropzone}
            onFilesChange={
              handleAssetFilesChange
            }
            onUploadsActiveChange={(active) => {
              assetUploadsActiveRef.current = active;
              setAssetUploadsActive(active);
            }}
            label={`Upload ${manualUploadCount} photo${
              manualUploadCount === 1
                ? ""
                : "s"
            }`}
            hint={`Upload ${manualUploadCount} PNG, JPG, or WEBP file${
              manualUploadCount === 1
                ? ""
                : "s"
            }.`}
            slotLabels={uploadableIndices.map(
              (idx) => {
                const item =
                  assets[idx];

                const name =
                  item?.asset_name ||
                  item?.asset ||
                  `Photo ${idx + 1}`;

                const isOpt =
                  item?.required === false;

                return `${name} ${
                  isOpt
                    ? "(Optional)"
                    : "(Required)"
                }`;
              }
            )}
          />
        )}
      </section>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <Button
          variant="outline"
          onClick={handleRetry}
          disabled={
            retriesLeft <= 0 ||
            retrying ||
            assetUploadsActive
          }
        >
          {retrying ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 size-4" />
          )}

          Re-ideate ({retriesLeft} left)
        </Button>

        <Button
          onClick={handleRender}
          disabled={!canRender}
          className="studio-checkpoint-primary h-10 rounded-full px-5"
        >
          {submitting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 size-4" />
          )}

          Done / Render Thumbnail
        </Button>
      </div>
    </div>
  );
}