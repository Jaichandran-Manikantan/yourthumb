"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type MouseEvent, type UIEvent } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Frame,
  Paintbrush,
  Copy,
  Lock,
  Loader2,
  UserCheck,
  UserX,
  Image as ImageIcon,
  Wand2,
  Type,
  ArrowDown,
  CircleHelp,
} from "lucide-react";
import {
  FileDropzone,
  type UploadedFile,
} from "./file-dropzone";
import { CheckpointModal } from "./checkpoint-modal";
import { DeliverableView } from "./deliverable-view";
import { CanvaConnectionControl } from "./canva-connection-control";
import { exportThumbnailToCanva } from "./canva-export-client";
import type { GenerationRecord } from "@/lib/types/generation";
import {
  persistLastGeneratedImageUrl,
  readLastGeneratedImageUrl,
} from "@/lib/generation/last-image";
import { cn } from "@/lib/utils";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

const MIN_WORDS = 10;
const MAX_WORDS = 300;
const MAX_THUMBNAIL_WORDS = 3;
const MAX_LONG_TEXT_CHARS = 3000;
const MAX_BACKGROUND_CHARS = 2000;
const MAX_THUMBNAIL_TEXT_CHARS = 100;

const STYLE_ANCHORS_BUCKET = "style-anchors";

type WorkflowMode = "frame" | "asset" | "copycat";
type BackgroundMode = "upload" | "ai";
type ThumbnailTextMode = "auto" | "custom";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Accurately truncates any string strictly to `maxWords`,
 * cutting off all trailing words, newlines, and text past the limit.
 */
function truncateToMaxWords(text: string, maxWords: number = MAX_WORDS): string {
  const matches = [...text.matchAll(/\S+/g)];
  if (matches.length <= maxWords) {
    return text;
  }

  // Locate the exact end position of the maxWords-th word
  const lastMatch = matches[maxWords - 1];
  const cutoffIndex = (lastMatch.index ?? 0) + lastMatch[0].length;
  return text.slice(0, cutoffIndex);
}

/**
 * UI-only input guard: enforce both the word and character limits.
 * Backend validation remains unchanged.
 */
function truncateToLimits(text: string, maxWords: number, maxChars: number): string {
  const wordLimited = truncateToMaxWords(text, maxWords);
  return wordLimited.slice(0, maxChars);
}

function wordBadgeVariant(words: number) {
  if (words < MIN_WORDS) return "destructive" as const;
  if (words === MAX_WORDS) return "secondary" as const;
  return "default" as const;
}

export function IngestionForm({
  userId,
  lastGeneratedImageUrl = null,
  initialGeneration = null,
}: {
  userId: string;
  lastGeneratedImageUrl?: string | null;
  initialGeneration?: GenerationRecord | null;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [thumbnailIdea, setThumbnailIdea] = useState("");
  const [frameDescription, setFrameDescription] = useState(
    initialGeneration?.frame_description ?? ""
  );
  const frameDescriptionRef = useRef(initialGeneration?.frame_description ?? "");
  const [workflow, setWorkflow] = useState<WorkflowMode>("copycat");
  const [includeHuman, setIncludeHuman] = useState<boolean>(true);

  // Thumbnail Text State
  const [thumbnailTextMode, setThumbnailTextMode] = useState<ThumbnailTextMode>("auto");
  const [customThumbnailText, setCustomThumbnailText] = useState("");

  // Background State
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("ai");
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [backgroundFile, setBackgroundFile] = useState<Array<UploadedFile | null>>([]);

  const [inspirationFiles, setInspirationFiles] = useState<Array<UploadedFile | null>>([
    null,
    null,
    null,
  ]);

  const [frameFile, setFrameFile] = useState<Array<UploadedFile | null>>([]);

  const [submitting, setSubmitting] = useState(false);
  const submissionLockRef = useRef(false);
  const submissionGenerationIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationRecord | null>(initialGeneration);
  // Set before the /api/ideate request starts so X/discard works even while
  // the ideator is still running and no GenerationRecord has reached the client yet.
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(
    initialGeneration?.id ?? null
  );
  const [checkpointOpen, setCheckpointOpen] = useState(
    Boolean(
      initialGeneration &&
        ["PENDING", "CHECKPOINT", "PROCESSING"].includes(initialGeneration.status)
    )
  );
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(
    initialGeneration?.final_image_url || lastGeneratedImageUrl
  );
  const [hasUnseenGeneratedThumbnail, setHasUnseenGeneratedThumbnail] = useState(false);
  const canvaResumeStartedRef = useRef(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("canva_resume") !== "1" || canvaResumeStartedRef.current) {
      return;
    }

    canvaResumeStartedRef.current = true;
    currentUrl.searchParams.delete("canva_resume");
    currentUrl.searchParams.delete("canva_connected");
    currentUrl.searchParams.delete("canva_error");
    window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);

    let cancelled = false;
    const resumeSelectedThumbnail = async () => {
      try {
        const response = await fetch("/api/canva/resume", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          resume?: { generationId?: string; imageUrl?: string; title?: string } | null;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "Could not resume Canva export.");
        if (!payload.resume) return;

        const editUrl = await exportThumbnailToCanva(payload.resume);
        if (!cancelled) window.location.replace(editUrl);
      } catch (resumeError) {
        console.error("Failed to resume selected Canva thumbnail:", resumeError);
        if (!cancelled) {
          setError(
            resumeError instanceof Error
              ? `Canva connected, but the selected thumbnail could not be opened: ${resumeError.message}`
              : "Canva connected, but the selected thumbnail could not be opened."
          );
        }
      }
    };

    void resumeSelectedThumbnail();
    return () => {
      cancelled = true;
    };
  }, []);
  const referenceSlotsRef = useRef<Array<UploadedFile | null>>([]);
  const referenceDurableSlotsRef = useRef<Array<string | null>>([null, null, null]);
  const referenceMutationVersionRef = useRef(0);
  const referencePersistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastOutputRef = useRef<HTMLDivElement | null>(null);
  const [activeScrollHint, setActiveScrollHint] = useState<
    "brief" | "direction" | "visual" | null
  >(null);
  const [openBriefHelp, setOpenBriefHelp] = useState<"topic" | "angle" | null>(null);
  const [openVisualHelp, setOpenVisualHelp] = useState(false);
  useEffect(() => {
    /*
     * Reference thumbnails are account-owned AND position-owned.
     *
     * Storage is only the object store. The user's three reference slots are
     * persisted separately so deleting slot 0 never causes slot 1/2 to move
     * into its place after a refresh.
     */
    const stored = readLastGeneratedImageUrl(userId);
    const url = lastGeneratedImageUrl || stored;

    if (url) {
      setLastImageUrl(url);
    }

    let cancelled = false;

    async function loadAccountReferenceThumbnails() {
      const loadVersion = referenceMutationVersionRef.current;
      try {
        const savedResponse = await fetch("/api/reference-thumbnails", {
          method: "GET",
          cache: "no-store",
        });

        if (savedResponse.ok) {
          const saved = (await savedResponse.json()) as {
            urls?: Array<string | null>;
          };

          if (
            referenceMutationVersionRef.current !== loadVersion
          ) {
            return;
          }

          if (Array.isArray(saved.urls) && saved.urls.length === 3) {
            const restored = saved.urls.map((savedUrl) => {
              if (!savedUrl) return null;
              const path = new URL(savedUrl).pathname.split(
                `/storage/v1/object/public/${STYLE_ANCHORS_BUCKET}/`
              )[1];
              if (!path) return null;
              return {
                url: savedUrl,
                path: decodeURIComponent(path),
                preview: savedUrl,
              };
            });

            referenceDurableSlotsRef.current = restored.map(
              (file) => file?.url?.trim() || null,
            );
            referenceSlotsRef.current = restored;
            if (!cancelled) setInspirationFiles(restored);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load saved reference slots:", err);
      }

      /*
       * One-time compatibility fallback for accounts created before slot
       * persistence existed. Once loaded, immediately persist the exact
       * three positions so future deletes cannot compact them.
       */
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.storage
        .from(STYLE_ANCHORS_BUCKET)
        .list(`${userId}/thumbnails`, {
          limit: 100,
          sortBy: {
            column: "created_at",
            order: "desc",
          },
        });

      if (cancelled) return;
      if (referenceMutationVersionRef.current !== loadVersion) return;

      if (error) {
        console.error("Failed to load account reference thumbnails:", error);
        return;
      }

      const referenceRetentionMs = 720 * 60 * 60 * 1000;
      const now = Date.now();

      const accountFiles: Array<UploadedFile | null> = data
        .filter((file) => {
          if (!file.name) return false;
          if (!file.created_at) return true;
          return now - new Date(file.created_at).getTime() < referenceRetentionMs;
        })
        .slice(0, 3)
        .map((file) => {
          const path = `${userId}/thumbnails/${file.name}`;
          const { data: publicData } = supabase.storage
            .from(STYLE_ANCHORS_BUCKET)
            .getPublicUrl(path);

          return {
            url: publicData.publicUrl,
            path,
            preview: publicData.publicUrl,
          };
        });

      const slots: Array<UploadedFile | null> = [
        accountFiles[0] ?? null,
        accountFiles[1] ?? null,
        accountFiles[2] ?? null,
      ];

      referenceDurableSlotsRef.current = slots.map(
        (file) => file?.url?.trim() || null,
      );
      referenceSlotsRef.current = slots;
      if (!cancelled) {
        setInspirationFiles(slots);
        void fetch("/api/reference-thumbnails", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            legacyBackfill: slots.map((file) => file?.url ?? null),
          }),
        }).catch((err) =>
          console.error("Failed to persist reference slots:", err)
        );
      }
    }

    void loadAccountReferenceThumbnails();

    return () => {
      cancelled = true;
    };
  }, [userId, lastGeneratedImageUrl]);

  /*
   * A PENDING row with no concept means the original ideation request may have
   * died after charging the credit. Resume it using the durable generation
   * inputs. The API's ideation claim prevents a live original request from
   * starting a second OpenAI call, while a stale lease can be reclaimed.
   */
  const ideationResumeStartedRef = useRef(false);

  useEffect(() => {
    const resumable = initialGeneration;
    if (
      ideationResumeStartedRef.current ||
      !resumable ||
      resumable.status !== "PENDING" ||
      resumable.title_options?.length ||
      resumable.viral_titles?.length
    ) {
      return;
    }

    // Legacy FRAME generations created before frame descriptions became
    // mandatory cannot be resumed safely. Do not enter the 15-second retry
    // loop for them; the user can start a fresh, fully specified generation.
    if (
      resumable.workflow === "FRAME" &&
      !resumable.frame_description?.trim()
    ) {
      return;
    }

    ideationResumeStartedRef.current = true;
    let cancelled = false;

    const resumeIdeation = async () => {
      const attempt = async () => {
        try {
          const response = await fetch("/api/ideate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generationId: resumable.id,
              workflow: resumable.workflow,
              topic: resumable.topic,
              thumbnailIdea: resumable.transcript ?? undefined,
              inspirationUrls: resumable.inspiration_urls ?? [],
              frameUrl: resumable.frame_url ?? undefined,
              frameDescription: resumable.frame_description ?? undefined,
              includeCreator: resumable.include_creator ?? true,
              thumbnailTextMode: resumable.thumbnail_text_mode ?? "auto",
              customThumbnailText:
                resumable.thumbnail_text_mode === "custom"
                  ? resumable.custom_thumbnail_text ?? undefined
                  : undefined,
              backgroundMode: resumable.ideation_background_mode ?? "ai",
              backgroundUrl: resumable.ideation_background_url ?? undefined,
              backgroundPrompt:
                resumable.ideation_background_prompt ?? undefined,
              rejectedConcepts: resumable.rejected_concepts ?? [],
            }),
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.error ?? "Could not resume ideation");
          }

          if (cancelled) return false;

          if (data.generation) {
            const nextGeneration = data.generation as GenerationRecord;
            setGeneration(nextGeneration);
            setActiveGenerationId(nextGeneration.id);
            setCheckpointOpen(
              ["PENDING", "CHECKPOINT", "PROCESSING"].includes(
                nextGeneration.status
              )
            );
          }

          if (data.abandoned) {
            setCheckpointOpen(false);
            setGeneration(null);
            setActiveGenerationId(null);
            return "ABANDONED";
          }

          return (data.generation?.status as string | undefined) ?? null;
        } catch (error) {
          if (!cancelled) {
            console.error("Failed to resume pending ideation:", error);
          }
          return false;
        }
      };

      await attempt();

      // Poll only while the row is still pending. This is deliberately gentle:
      // a live server-side ideation call is not duplicated because its lease is
      // fresh; after the lease becomes stale, the next poll can reclaim it.
      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 15_000));
        if (cancelled) break;
        const nextStatus = await attempt();
        if (nextStatus && nextStatus !== "PENDING") break;
      }
    };

    void resumeIdeation();

    return () => {
      cancelled = true;
    };
  }, [initialGeneration]);

  async function handleInspirationFilesChange(
    files: Array<UploadedFile | null>,
    changedIndices?: number[],
  ) {
    // Merge only the changed positions into the latest local snapshot.
    // Uploads can finish in any order, so one callback must never replace a
    // sibling slot with the callback's stale array.
    const normalized = [...referenceSlotsRef.current];
    const indices = changedIndices?.length ? changedIndices : [0, 1, 2];

    while (normalized.length < 3) normalized.push(null);
    normalized.length = 3;

    for (const index of indices) {
      if (index >= 0 && index < 3) {
        normalized[index] = files[index] ?? null;
      }
    }

    referenceMutationVersionRef.current += 1;

    // Local state is updated immediately and remains the UI source of truth.
    referenceSlotsRef.current = normalized;
    setInspirationFiles(normalized);

    // Queue only persistence. The actual image uploads remain fully parallel.
    // Each queued task reads the newest local + durable state when it starts.
    const queued = referencePersistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const durable = [...referenceDurableSlotsRef.current];
        const latest = [...referenceSlotsRef.current];

        // Temporary upload placeholders have url="". Preserve their last
        // durable value until that particular upload returns a real URL.
        const desired = Array.from({ length: 3 }, (_, index) => {
          const file = latest[index];

          if (file && !file.url?.trim()) {
            return durable[index] ?? null;
          }

          return file?.url?.trim() || null;
        });

        const changed = desired.some(
          (url, index) => url !== (durable[index] ?? null),
        );

        if (!changed) return;

        const response = await fetch("/api/reference-thumbnails", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previousUrls: durable,
            urls: desired,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to persist reference slots");
        }

        const saved = await response.json().catch(() => ({}));
        const savedUrls =
          Array.isArray(saved.urls) && saved.urls.length === 3
            ? saved.urls.map((url: unknown) =>
                typeof url === "string" && url.trim() ? url : null,
              )
            : desired;

        // Update only the durable server snapshot. Never copy the response into
        // the UI because another upload may already have changed local state.
        referenceDurableSlotsRef.current = savedUrls;
      })
      .catch(async (error) => {
        // A newer mutation owns the UI. Never roll it back because an older
        // persistence request failed.
        if (referenceMutationVersionRef.current > 0) {
          // The queued work is retried by the newer mutation when appropriate.
          // Avoid a stale response/failure replacing newer local state.
        }

        console.error("Failed to persist reference slots:", error);
        throw error;
      });

    referencePersistQueueRef.current = queued;
    await queued;
  }
  const hasInspiration = Boolean(inspirationFiles[0]?.url);

  const topicWords = countWords(topic);
  const ideaWords = countWords(thumbnailIdea);
  const frameDescriptionWords = countWords(frameDescription);
  const customTextWords = countWords(customThumbnailText);
  const backgroundWords = countWords(backgroundPrompt);

  const topicTooShort = topicWords > 0 && topicWords < MIN_WORDS;
  const topicAtMax = topicWords >= MAX_WORDS; 
  const ideaAtMax = ideaWords >= MAX_WORDS;
  const customTextAtMax = customTextWords >= MAX_THUMBNAIL_WORDS;
  const backgroundAtMax = backgroundWords >= MAX_WORDS;
  const frameDescriptionTooShort =
    workflow === "frame" && frameDescriptionWords > 0 && frameDescriptionWords < MIN_WORDS;
  const frameDescriptionTooLong =
    workflow === "frame" && frameDescriptionWords > MAX_WORDS;
  const frameDescriptionInvalid =
    workflow === "frame" &&
    (frameDescriptionWords === 0 ||
      frameDescriptionTooShort ||
      frameDescriptionTooLong ||
      frameDescription.length > MAX_LONG_TEXT_CHARS);

  const frameMissing = workflow === "frame" && !frameFile.some((file) => Boolean(file?.url));
  const backgroundMissing =
    backgroundMode === "upload" && !backgroundFile.some((file) => Boolean(file?.url));
  const customTextInvalid =
    thumbnailTextMode === "custom" && customTextWords === 0;

      const requirementsMet =
    topicWords >= MIN_WORDS &&
    topicWords <= MAX_WORDS &&
    ideaWords <= MAX_WORDS &&
    !customTextInvalid &&
    customTextWords <= MAX_THUMBNAIL_WORDS &&
    (backgroundMode !== "ai" || backgroundWords <= MAX_WORDS) &&
    !frameMissing &&
    !backgroundMissing &&
    (workflow !== "frame" ||
      (frameDescriptionWords >= MIN_WORDS &&
        frameDescriptionWords <= MAX_WORDS &&
        frameDescription.length <= MAX_LONG_TEXT_CHARS)) &&
    hasInspiration;

  const canSubmit = requirementsMet && !submitting;
  const hasViewableLastOutput = Boolean(
    lastImageUrl && (!checkpointOpen || generation?.status === "COMPLETED")
  );

  function handleViewLastOutput() {
    setHasUnseenGeneratedThumbnail(false);
    const target = lastOutputRef.current;
    if (!target) return;

    const scrollContainer = target.closest(".studio-panel-body") as HTMLElement | null;
    const isPanelScrollable = Boolean(
      scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 1
    );

    if (scrollContainer && isPanelScrollable) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 12,
        behavior: "smooth",
      });
      return;
    }

    // On narrow layouts the panel body intentionally stops being a scroll
    // container, so let the document viewport perform the navigation instead.
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  type ScrollHintPanel = "brief" | "direction" | "visual";

  function updateScrollHint(
    panel: ScrollHintPanel,
    event: MouseEvent<HTMLDivElement>,
  ) {
    const element = event.currentTarget;

    // The hint is intentionally desktop-only. Mouse events do not fire for a
    // normal touch interaction, and this explicit media query keeps the UI
    // hidden on touch-capable/hybrid devices as well.
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    const hasMoreBelow = element.scrollHeight > element.clientHeight + 2;
    const atBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 2;

    if (!hasMoreBelow || atBottom) {
      setActiveScrollHint((current) => (current === panel ? null : current));
      return;
    }

    const rect = element.getBoundingClientRect();
    const pointerProgress = (event.clientY - rect.top) / rect.height;

    if (pointerProgress >= 0.6) {
      setActiveScrollHint(panel);
    } else {
      setActiveScrollHint((current) => (current === panel ? null : current));
    }
  }

  function handlePanelScroll(
    panel: ScrollHintPanel,
    event: UIEvent<HTMLDivElement>,
  ) {
    const element = event.currentTarget;
    const hasMoreBelow = element.scrollHeight > element.clientHeight + 2;
    const atBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 2;

    if (!hasMoreBelow || atBottom) {
      setActiveScrollHint((current) => (current === panel ? null : current));
    }
  }

  function handleScrollHintToBottom(
    panel: ScrollHintPanel,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();

    const body = event.currentTarget.parentElement as HTMLElement | null;

    if (!body || !body.classList.contains("studio-panel-body")) {
      return;
    }

    body.scrollTo({
      top: body.scrollHeight,
      behavior: "smooth",
    });
    setActiveScrollHint((current) => (current === panel ? null : current));
  }

  function handleTopicChange(value: string) {
    setTopic(truncateToLimits(value, MAX_WORDS, MAX_LONG_TEXT_CHARS));
  }

  function handleIdeaChange(value: string) {
    setThumbnailIdea(truncateToLimits(value, MAX_WORDS, MAX_LONG_TEXT_CHARS));
  }

  function handleCustomTextChange(value: string) {
    setCustomThumbnailText(truncateToLimits(value, MAX_THUMBNAIL_WORDS, MAX_THUMBNAIL_TEXT_CHARS));
  }

  function handleBackgroundPromptChange(value: string) {
    setBackgroundPrompt(truncateToLimits(value, MAX_WORDS, MAX_BACKGROUND_CHARS));
  }

  function handleFrameDescriptionChange(value: string) {
    const nextValue = truncateToLimits(value, MAX_WORDS, MAX_LONG_TEXT_CHARS);
    frameDescriptionRef.current = nextValue;
    setFrameDescription(nextValue);
  }

  function handleTopicPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    const merged = topic.slice(0, start) + pastedText + topic.slice(end);
    setTopic(truncateToLimits(merged, MAX_WORDS, MAX_LONG_TEXT_CHARS));
  }

  function handleIdeaPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    const merged = thumbnailIdea.slice(0, start) + pastedText + thumbnailIdea.slice(end);
    setThumbnailIdea(truncateToLimits(merged, MAX_WORDS, MAX_LONG_TEXT_CHARS));
  }

  function handleCustomTextPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    const merged = customThumbnailText.slice(0, start) + pastedText + customThumbnailText.slice(end);
    setCustomThumbnailText(truncateToLimits(merged, MAX_THUMBNAIL_WORDS, MAX_THUMBNAIL_TEXT_CHARS));
  }

  function handleBackgroundPromptPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    const merged = backgroundPrompt.slice(0, start) + pastedText + backgroundPrompt.slice(end);
    setBackgroundPrompt(truncateToLimits(merged, MAX_WORDS, MAX_BACKGROUND_CHARS));
  }

  function handleFrameDescriptionPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    const merged =
      frameDescription.slice(0, start) +
      pastedText +
      frameDescription.slice(end);

    const nextValue = truncateToLimits(merged, MAX_WORDS, MAX_LONG_TEXT_CHARS);
    frameDescriptionRef.current = nextValue;
    setFrameDescription(nextValue);
  }

  async function handleAbandonGeneration() {
    const generationId = generation?.id ?? activeGenerationId;

    if (!generationId) {
      setCheckpointOpen(false);
      return;
    }

    try {
      let data: any = {};
      let lastError: Error | null = null;

      /*
       * The ideation request creates the generation row immediately, but a
       * very fast X click can race that insert by a few hundred milliseconds.
       * Retry a short-lived 404 so discard remains reliable in that window.
       */
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await fetch("/api/generations/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId }),
        });

        data = await res.json().catch(() => ({}));

        if (res.ok) {
          lastError = null;
          break;
        }

        lastError = new Error(
          data.error ?? "Could not discard generation"
        );

        if (res.status !== 404 || attempt === 4) {
          throw lastError;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setCheckpointOpen(false);
      setGeneration(null);
      setActiveGenerationId(null);
      setLastImageUrl(null);
      setError(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not discard generation"
      );
    }
  }

async function handleSubmit() {
    // React state updates are asynchronous. Use an immediate ref lock so two
    // click/submit events in the same turn cannot create two different UUIDs
    // before `submitting` becomes true.
    if (!canSubmit || submissionLockRef.current) return;

    submissionLockRef.current = true;
    setError(null);
    setSubmitting(true);
    setCheckpointOpen(true);

    // Keep one stable generation identity for the entire client submission
    // attempt. A retry after a network/server failure reuses the same UUID so
    // the database RPC can recover the already-created generation without
    // consuming another credit.
    const requestGenerationId =
      submissionGenerationIdRef.current ?? crypto.randomUUID();
    submissionGenerationIdRef.current = requestGenerationId;
    setActiveGenerationId(requestGenerationId);

    try {
      const payloadWorkflow =
        workflow === "copycat"
          ? "COPYCAT"
          : workflow === "frame"
            ? "FRAME"
            : "ASSET";

      // COPYCAT has exactly one structural master: the visible Style Ref 1
      // slot. Never compact hidden saved references into the master position.
      const validInspirations =
        workflow === "copycat"
          ? inspirationFiles[0]?.url
            ? [inspirationFiles[0].url]
            : []
          : inspirationFiles
              .filter((f): f is UploadedFile => Boolean(f))
              .map((f) => f.url);

      const currentFrameDescription = frameDescriptionRef.current.trim();

      const payload = {
        generationId: requestGenerationId,
        workflow: payloadWorkflow,
        topic: topic.trim(),
        thumbnailIdea: thumbnailIdea.trim() || undefined,
        thumbnailTextMode,
        customThumbnailText:
          thumbnailTextMode === "custom" && customThumbnailText.trim()
            ? customThumbnailText.trim()
            : undefined,
        inspirationUrls:
          workflow === "copycat"
            ? validInspirations.slice(0, 1)
            : validInspirations,
        frameUrl:
          workflow === "frame"
            ? (frameFile.find(Boolean)?.url ?? undefined)
            : undefined,
        frameDescription:
          workflow === "frame" ? currentFrameDescription || undefined : undefined,
        includeCreator: workflow === "asset" ? includeHuman : undefined,
        // FRAME: no user background input. The strategist decides whether
        // to preserve, transform, or generate the environment from the frame.
        backgroundMode: workflow === "frame" ? "ai" : backgroundMode,
        backgroundUrl:
          workflow === "frame"
            ? undefined
            : backgroundMode === "upload"
              ? (backgroundFile.find(Boolean)?.url ?? undefined)
              : undefined,
        backgroundPrompt:
          workflow === "frame"
            ? undefined
            : backgroundMode === "ai" && backgroundPrompt.trim()
              ? backgroundPrompt.trim()
              : undefined,
      };

      const res = await fetch("/api/ideate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Client/input/eligibility errors did not complete a paid submission,
        // so the next intentional submit should get a fresh identity.
        if (res.status < 500) {
          submissionGenerationIdRef.current = null;
        }

        if (data.error === "Expired pack" || data.error_code === "EXPIRED_PACK") {
          throw new Error(
            "Your generation pack has expired. Renew your plan to use your remaining generations."
          );
        }

        if (res.status === 402) {
          throw new Error(
            "You don't have enough generations. Top up to continue."
          );
        }

        throw new Error(data.error ?? "Failed to generate concepts");
      }

      // The successful request has either created the generation or recovered
      // the same generation from an idempotent retry. A later intentional
      // generation should receive a new identity.
      submissionGenerationIdRef.current = null;

      if (data.generation) {
        const nextGeneration = data.generation as GenerationRecord;
        setGeneration(nextGeneration);
        setActiveGenerationId(nextGeneration.id);
      }

      if (data.abandoned) {
        setCheckpointOpen(false);
        setGeneration(null);
        setActiveGenerationId(null);
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setCheckpointOpen(false);
    } finally {
      submissionLockRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="studio-ingestion">
      <style>{`
        .studio-ingestion {
          --studio-bg: #0b0a09;
          --studio-surface: #141210;
          --studio-surface-2: #191714;
          --studio-surface-3: #201d19;
          --studio-ink: #f6f1e8;
          --studio-muted: #b7aea2;
          --studio-quiet: #90877b;
          --studio-line: rgba(255,244,228,.15);
          --studio-line-soft: rgba(255,244,228,.09);
          --studio-accent: #ff526b;
          --studio-accent-soft: rgba(255,82,107,.12);
          --studio-good: #88dca2;
          width: 100%;
          height: 100%;
          min-height: 0;
          color: var(--studio-ink);
          overflow: hidden;
        }

        .studio-ingestion .studio-page {
          display: flex;
          height: 100%;
          min-height: 0;
          max-width: 1540px;
          margin: 0 auto;
          flex-direction: column;
          padding: 22px 38px 88px;
          position: relative;
          overflow: hidden;
        }

        .studio-ingestion .studio-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          flex: 0 0 auto;
          align-items: end;
          column-gap: 28px;
          margin-bottom: 18px;
        }

        .studio-ingestion .studio-header-main {
          min-width: 0;
        }

        .studio-ingestion .studio-header-action {
          align-self: end;
          justify-self: center;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 2px;
          border: 1px solid rgba(255,82,107,.55);
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,82,107,.24), rgba(255,82,107,.12));
          padding: 11px 17px 11px 18px;
          color: #ffe3e7;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .065em;
          text-transform: uppercase;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.035), 0 10px 28px rgba(255,82,107,.13);
          transform-origin: center;
          will-change: transform;
          transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease;
        }

        .studio-ingestion .studio-header-action--attention {
          animation: studio-view-generated-pulse .9s ease-in-out infinite;
        }

        @keyframes studio-view-generated-pulse {
          0%, 100% {
            transform: scale(1);
          }
          18% {
            transform: scale(1.09);
          }
          36% {
            transform: scale(.96);
          }
          54% {
            transform: scale(1.075);
          }
          72% {
            transform: scale(.97);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .studio-ingestion .studio-header-action--attention {
            animation: none;
          }
        }

        .studio-ingestion .studio-header-action:hover {
          border-color: rgba(255,116,136,.72);
          background: linear-gradient(180deg, rgba(255,82,107,.24), rgba(255,82,107,.12));
          color: #fff6f7;
          transform: translateY(-1px);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), 0 12px 32px rgba(255,82,107,.14);
        }

        .studio-ingestion .studio-header-action:focus-visible {
          outline: 2px solid var(--studio-accent);
          outline-offset: 3px;
        }

        .studio-ingestion .studio-header-meta {
          justify-self: end;
        }

        .studio-ingestion .studio-kicker,
        .studio-ingestion .studio-panel-kicker,
        .studio-ingestion .studio-field-label,
        .studio-ingestion .studio-meta,
        .studio-ingestion .studio-command-note {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
          text-transform: uppercase;
          letter-spacing: .11em;
        }

        .studio-ingestion .studio-kicker {
          color: #968d81;
          font-size: 10px;
        }

        .studio-ingestion .studio-title {
          margin: 7px 0 7px;
          font-size: clamp(36px, 3.35vw, 46px);
          line-height: .98;
          font-weight: 700;
          letter-spacing: -.055em;
          color: var(--studio-ink);
        }

        .studio-ingestion .studio-subtitle {
          max-width: 720px;
          color: #b6ada1;
          font-size: 13px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-workspace {
          display: grid;
          flex: 1 1 auto;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr) minmax(0, 1fr);
          align-items: stretch;
          min-height: 0;
          gap: 1px;
          overflow: hidden;
          border: 1px solid var(--studio-line);
          border-radius: 16px;
          background: var(--studio-line);
          box-shadow: 0 28px 80px rgba(0,0,0,.28);
        }

        .studio-ingestion .studio-panel {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(22,20,17,.98), rgba(17,15,13,.98));
        }

        .studio-ingestion .studio-scroll-hint {
          position: absolute;
          left: 50%;
          bottom: 16px;
          z-index: 8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255,244,228,.18);
          border-radius: 999px;
          background: rgba(27,24,21,.94);
          color: #efe7dc;
          box-shadow: 0 12px 30px rgba(0,0,0,.32);
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 6px);
          transition: opacity .18s ease, transform .18s ease, border-color .18s ease, background .18s ease;
        }

        .studio-ingestion .studio-scroll-hint.active {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }

        .studio-ingestion .studio-scroll-hint:hover {
          border-color: rgba(255,82,107,.5);
          background: rgba(35,28,27,.98);
          color: #fff7ef;
        }

        .studio-ingestion .studio-scroll-hint svg {
          width: 15px;
          height: 15px;
          animation: studio-scroll-hint-bob 1.6s ease-in-out infinite;
        }

        @keyframes studio-scroll-hint-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }

        .studio-ingestion .studio-panel + .studio-panel {
          border-left: 1px solid var(--studio-line);
        }

        .studio-ingestion .studio-panel-head {
          position: sticky;
          top: 0;
          z-index: 3;
          min-height: 68px;
          flex: 0 0 68px;
          padding: 16px 24px 13px;
          border-bottom: 1px solid var(--studio-line-soft);
          background: rgba(18,16,14,.98);
          backdrop-filter: blur(10px);
        }

        .studio-ingestion .studio-panel-kicker {
          color: #e0d8cc;
          font-size: 10px;
        }

        .studio-ingestion .studio-panel-hint {
          margin-top: 4px;
          color: #958c80;
          font-size: 10px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-panel-body {
          display: flex;
          min-height: 0;
          flex: 1 1 auto;
          flex-direction: column;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,244,228,.10) transparent;
          padding: 20px 24px 24px;
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar {
          width: 4px;
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(255,244,228,.10);
        }

        .studio-ingestion .studio-panel-body:hover::-webkit-scrollbar-thumb {
          background: rgba(255,244,228,.20);
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar {
          width: 7px;
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(255,244,228,.15);
        }

        .studio-ingestion .studio-panel-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255,244,228,.24);
        }

        .studio-ingestion .studio-brief-copy {
          max-width: 43ch;
          color: #c9c0b5;
          font-size: 12px;
          line-height: 1.55;
        }

        .studio-ingestion .studio-field {
          margin-bottom: 24px;
        }

        .studio-ingestion .studio-field-label {
          display: block;
          margin-bottom: 10px;
          color: #c0b6a9;
          font-size: 10px;
          font-weight: 500;
        }

        .studio-ingestion .studio-panel-kicker-row {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .studio-ingestion .studio-panel-help-popover {
          margin: 0 0 12px;
        }

        .studio-ingestion .studio-field-label-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-height: 18px;
        }

        .studio-ingestion .studio-field-label-row .studio-field-label {
          margin-bottom: 0;
        }

        .studio-ingestion .studio-optional-label {
          color: #766d62;
        }

        .studio-ingestion .studio-help-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          padding: 0;
          border: 1px solid rgba(255,244,228,.18);
          border-radius: 999px;
          background: rgba(255,244,228,.035);
          color: #8f877c;
          cursor: pointer;
          transition: color .18s ease, border-color .18s ease, background .18s ease, transform .18s ease;
        }

        .studio-ingestion .studio-help-button:hover,
        .studio-ingestion .studio-help-button.active {
          border-color: rgba(255,244,228,.34);
          background: rgba(255,244,228,.08);
          color: #f2eadf;
          transform: translateY(-1px);
        }

        .studio-ingestion .studio-help-button:focus-visible {
          outline: 2px solid var(--studio-accent);
          outline-offset: 2px;
        }

        .studio-ingestion .studio-help-button svg {
          width: 12px;
          height: 12px;
        }

        .studio-ingestion .studio-help-popover {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin: -1px 0 12px;
          padding: 11px 13px;
          border: 1px solid rgba(255,244,228,.12);
          border-radius: 10px;
          background: rgba(28,25,22,.96);
          box-shadow: 0 16px 34px rgba(0,0,0,.24);
        }

        .studio-ingestion .studio-help-popover strong {
          color: #e7ded2;
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
          letter-spacing: .1em;
        }

        .studio-ingestion .studio-help-popover span {
          max-width: 52ch;
          color: #aea497;
          font-size: 11px;
          line-height: 1.5;
        }

        .studio-ingestion .studio-required {
          color: var(--studio-accent);
        }

        .studio-ingestion .studio-textarea,
        .studio-ingestion .studio-input {
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(255,244,228,.21);
          border-radius: 0;
          outline: 0;
          background: transparent;
          color: #f4eee5;
          font-family: inherit;
          transition: border-color .18s ease;
        }

        .studio-ingestion .studio-textarea {
          min-height: 138px;
          padding: 2px 0 13px;
          resize: vertical;
          font-size: 15px;
          line-height: 1.65;
          letter-spacing: -.01em;
        }

        .studio-ingestion .studio-textarea.idea {
          min-height: 104px;
        }

        .studio-ingestion .studio-input {
          height: 42px;
          padding: 0;
          font-size: 13px;
        }

        .studio-ingestion .studio-textarea::placeholder,
        .studio-ingestion .studio-input::placeholder {
          color: #83796d;
          opacity: 1;
        }

        .studio-ingestion .studio-textarea:focus,
        .studio-ingestion .studio-input:focus {
          border-color: var(--studio-accent);
        }

        .studio-ingestion .studio-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 9px;
          color: #92897d;
          font-size: 10px;
          line-height: 1.4;
        }

        .studio-ingestion .studio-status-good {
          color: var(--studio-good);
          font-weight: 600;
        }

        .studio-ingestion .studio-status-warn {
          color: #f2ba6d;
          font-weight: 600;
        }

        .studio-ingestion .studio-status-bad {
          color: #ff8998;
          font-weight: 600;
        }

        .studio-ingestion .studio-brief-note {
          margin-top: 8px;
          max-width: 340px;
          padding: 4px 0 4px 14px;
          border-left: 1px solid rgba(255,244,228,.22);
          color: #9c9286;
          font-size: 11px;
          line-height: 1.6;
        }

        .studio-ingestion .studio-mode-label {
          margin-bottom: 10px;
          color: #a59b8e;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .studio-ingestion .studio-mode-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .studio-ingestion .studio-mode {
          position: relative;
          min-height: 124px;
          padding: 14px;
          border: 1px solid rgba(255,244,228,.13);
          border-radius: 11px;
          background: rgba(255,255,255,.018);
          color: var(--studio-ink);
          text-align: left;
          transition: border-color .18s ease, background .18s ease, transform .18s ease;
        }

        .studio-ingestion .studio-mode:hover {
          border-color: rgba(255,244,228,.23);
          background: rgba(255,255,255,.03);
          transform: translateY(-1px);
        }

        .studio-ingestion .studio-mode.active {
          border-color: rgba(255,82,107,.64);
          background: linear-gradient(180deg, rgba(255,82,107,.13), rgba(255,82,107,.055));
          box-shadow: inset 0 0 0 1px rgba(255,82,107,.08);
        }

        .studio-ingestion .studio-mode.active::after {
          content: "";
          position: absolute;
          top: 10px;
          right: 10px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--studio-accent);
          box-shadow: 0 0 14px rgba(255,82,107,.62);
        }

        .studio-ingestion .studio-mode-number {
          margin-bottom: 18px;
          color: #8e8579;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
        }

        .studio-ingestion .studio-mode.active .studio-mode-number {
          color: #ff9bab;
        }

        .studio-ingestion .studio-mode-title {
          display: block;
          margin-bottom: 6px;
          color: #f3ede4;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -.02em;
        }

        .studio-ingestion .studio-mode-copy {
          display: block;
          color: #a49a8e;
          font-size: 10px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 16px;
          padding: 14px 0;
          border-top: 1px solid var(--studio-line-soft);
          border-bottom: 1px solid var(--studio-line-soft);
        }

        .studio-ingestion .studio-row-title {
          color: #f2ece3;
          font-size: 12px;
          font-weight: 700;
        }

        .studio-ingestion .studio-row-copy {
          margin-top: 4px;
          max-width: 330px;
          color: #9f9588;
          font-size: 10px;
          line-height: 1.5;
        }

        .studio-ingestion .studio-switch {
          position: relative;
          width: 44px;
          height: 24px;
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          background: #3c3833;
          transition: background .18s ease;
        }

        .studio-ingestion .studio-switch.active { background: var(--studio-accent); }

        .studio-ingestion .studio-switch span {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fffaf1;
          box-shadow: 0 2px 8px rgba(0,0,0,.28);
          transition: transform .18s ease;
        }

        .studio-ingestion .studio-switch.active span { transform: translateX(20px); }

        .studio-ingestion .studio-choice {
          padding: 16px 0;
          border-bottom: 1px solid var(--studio-line-soft);
        }

        .studio-ingestion .studio-choice-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .studio-ingestion .studio-choice-title {
          color: #f3ede4;
          font-size: 12px;
          font-weight: 700;
        }

        .studio-ingestion .studio-choice-copy {
          margin-top: 4px;
          color: #9f9588;
          font-size: 10px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }

        .studio-ingestion .studio-pill {
          border: 1px solid rgba(255,244,228,.14);
          border-radius: 7px;
          background: rgba(255,255,255,.02);
          padding: 7px 10px;
          color: #aba196;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 8px;
          letter-spacing: .05em;
          text-transform: uppercase;
          transition: all .18s ease;
        }

        .studio-ingestion .studio-pill:hover { border-color: rgba(255,244,228,.25); color: #ece5db; }
        .studio-ingestion .studio-pill.active { border-color: #f0e9de; background: #f0e9de; color: #171310; }

        .studio-ingestion .studio-support {
          margin-top: 12px;
        }

        .studio-ingestion .studio-upload-block {
          margin-top: 12px;
        }

        .studio-ingestion .studio-upload-heading {
          margin-bottom: 8px;
          color: #b8aea2;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .studio-ingestion .studio-visual-intro {
          margin: 0 0 14px;
          max-width: 340px;
          color: #aaa095;
          font-size: 11px;
          line-height: 1.6;
        }

        .studio-ingestion .studio-reference-shell {
          width: 100%;
          border: 1px solid rgba(255,244,228,.10);
          border-radius: 11px;
          background: rgba(255,255,255,.012);
          padding: 12px;
        }

        .studio-ingestion .studio-last-output {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--studio-line-soft);
        }

        .studio-ingestion .studio-last-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
        }

        .studio-ingestion .studio-last-title {
          color: #f2ece3;
          font-size: 12px;
          font-weight: 700;
        }

        .studio-ingestion .studio-retention {
          color: #92887b;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 8px;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .studio-ingestion .studio-output-frame {
          overflow: hidden;
          border: 1px solid rgba(255,244,228,.11);
          border-radius: 10px;
          background: #0d0c0b;
        }

        .studio-ingestion .studio-output-frame img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }

        .studio-ingestion .studio-empty-output {
          display: grid;
          min-height: 190px;
          place-items: center;
          padding: 24px;
          border: 1px dashed rgba(255,244,228,.15);
          border-radius: 10px;
          color: #8e8478;
          text-align: center;
          background: rgba(255,255,255,.01);
        }

        .studio-ingestion .studio-empty-output strong {
          display: block;
          color: #b7ada1;
          font-size: 11px;
        }

        .studio-ingestion .studio-empty-output span {
          display: block;
          margin-top: 5px;
          font-size: 10px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-error {
          position: absolute;
          right: 38px;
          bottom: 84px;
          left: 38px;
          z-index: 25;
          margin: 0 auto;
          max-width: 1200px;
          border: 1px solid rgba(255,116,136,.34);
          border-radius: 9px;
          background: rgba(255,82,107,.08);
          padding: 10px 12px;
          color: #ff9baa;
          font-size: 12px;
          line-height: 1.45;
        }

        .studio-ingestion .studio-asset-stack { display: flex; flex-direction: column; gap: 14px; }

        .studio-ingestion .studio-command {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 30;
          padding: 10px 24px;
          background: linear-gradient(180deg, rgba(11,10,9,.03), rgba(11,10,9,.94) 35%);
          pointer-events: none;
        }

        .studio-ingestion .studio-command-inner {
          display: flex;
          width: min(1060px, calc(100vw - 48px));
          max-width: 1060px;
          min-height: 64px;
          margin: 0 auto;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 9px 10px 9px 17px;
          border: 1px solid rgba(255,244,228,.15);
          border-radius: 13px;
          background: rgba(27,24,21,.97);
          box-shadow: 0 18px 60px rgba(0,0,0,.5);
          backdrop-filter: blur(20px);
          pointer-events: auto;
        }

        .studio-ingestion .studio-command-status {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #a69c90;
          font-size: 10px;
        }

        .studio-ingestion .studio-command-status strong {
          color: #e3dbd0;
          font-size: 9px;
          letter-spacing: .05em;
        }

        .studio-ingestion .studio-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--studio-good);
          box-shadow: 0 0 13px rgba(136,220,162,.44);
        }

        .studio-ingestion .studio-build {
          min-width: 180px;
          height: 44px;
          border: 0;
          border-radius: 9px;
          background: var(--studio-accent);
          color: #fff8f2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .01em;
          box-shadow: 0 9px 24px rgba(255,82,107,.17);
          transition: background .18s ease, transform .18s ease;
        }

        .studio-ingestion .studio-build:hover:not(:disabled) {
          background: #ff7488;
          transform: translateY(-1px);
        }

        .studio-ingestion .studio-build:disabled {
          cursor: not-allowed;
          opacity: .48;
          box-shadow: none;
        }

        /* Keep the existing FileDropzone behavior; this is presentation only. */
        .studio-ingestion .studio-upload {
          color: #f2ece3;
        }

        .studio-ingestion .studio-upload > div:first-child {
          margin-bottom: 1px;
          color: #c6bcb0 !important;
          font-size: 10px !important;
          font-family: var(--font-mono), ui-monospace, monospace;
          letter-spacing: .075em;
          text-transform: uppercase;
        }

        .studio-ingestion .studio-upload > div:nth-child(2) {
          color: #9f9588 !important;
          font-size: 10px !important;
          line-height: 1.45;
        }

        .studio-ingestion .studio-upload div[class*="border-2"][class*="border-dashed"] {
          min-height: 132px;
          border-color: rgba(255,244,228,.16) !important;
          border-radius: 10px;
          background: rgba(255,255,255,.012) !important;
        }

        /* Reference slots share the same visual frame whether empty or filled. */
        .studio-ingestion .studio-reference-shell.studio-upload div[class*="border-2"][class*="border-dashed"] {
          min-height: 0;
          height: auto;
          aspect-ratio: 16 / 9;
          padding-top: 0;
          padding-bottom: 0;
        }

        /* Keep every style-reference column on the same vertical grid. */
        .studio-ingestion .studio-reference-shell .grid > div > p {
          min-height: 36px;
          margin: 0;
          align-items: flex-start;
          line-height: 1.25;
        }

        .studio-ingestion .studio-reference-shell .grid {
          gap: 10px;
        }

        .studio-ingestion .studio-reference-shell .grid > div {
          min-width: 0;
        }

        /* Copycat has one structural master, so give its preview the same 16:9 visual grammar as the reference slots. */
        .studio-ingestion .studio-copycat-reference-preview {
          width: min(260px, 100%) !important;
          height: auto !important;
          aspect-ratio: 16 / 9;
        }

        .studio-ingestion .studio-upload div[class*="border-2"][class*="border-dashed"] p {
          color: #d2c9bd !important;
          font-size: 11px !important;
        }

        .studio-ingestion .studio-upload div[class*="border-2"][class*="border-dashed"] p + p {
          color: #91877b !important;
          font-size: 9px !important;
        }

        .studio-ingestion .studio-upload img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-color: rgba(255,244,228,.12) !important;
          border-radius: 10px !important;
        }

        .studio-ingestion .studio-upload [class*="bg-zinc-100"] {
          background: #171411 !important;
        }

        .studio-ingestion .studio-upload [class*="text-zinc-500"] {
          color: #a39a8e !important;
        }

        .studio-ingestion .studio-upload [class*="text-zinc-700"] {
          color: #d7cec2 !important;
        }

        .studio-ingestion .studio-upload [class*="text-zinc-400"] {
          color: #8e8579 !important;
        }

        .studio-ingestion .studio-upload [class*="border-zinc-300"] {
          border-color: rgba(255,244,228,.16) !important;
        }

        /* Desktop studio owns the viewport; panel bodies are the only scroll surfaces. */
        @media (min-width: 861px) {
          .studio-ingestion {
            height: calc(100dvh - 72px);
            min-height: 0;
          }

          .studio-ingestion .studio-page {
            height: 100%;
            min-height: 0;
          }

          .studio-ingestion .studio-workspace {
            min-height: 0;
            height: 100%;
          }

          .studio-ingestion .studio-panel-body {
            min-height: 0;
            overflow-y: scroll;
            overscroll-behavior: contain;
            scrollbar-gutter: stable;
          }

          .studio-ingestion .studio-panel-body::-webkit-scrollbar {
            width: 6px;
          }

          .studio-ingestion .studio-panel-body::-webkit-scrollbar-thumb {
            background: rgba(255,244,228,.18);
          }

          .studio-ingestion .studio-panel-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255,244,228,.30);
          }
        }

        .studio-ingestion .studio-frame-choice {
          padding-top: 14px;
        }

        .studio-ingestion .studio-frame-choice .frame-description {
          min-height: 60px;
        }

        @media (max-width: 1180px) {
          .studio-ingestion .studio-page { padding-left: 24px; padding-right: 24px; }
          .studio-ingestion .studio-workspace { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); }
          .studio-ingestion .studio-visual { grid-column: 1 / -1; border-left: 0 !important; border-top: 1px solid var(--studio-line); }
          .studio-ingestion .studio-reference-shell { max-width: none; }
        }

        @media (hover: none), (pointer: coarse) {
          .studio-ingestion .studio-scroll-hint {
            display: none !important;
          }
        }

        @media (max-width: 860px) {
          .studio-ingestion .studio-page { height: auto; min-height: 100%; overflow: visible; padding: 28px 16px 124px; }
          .studio-ingestion .studio-header { display: block; margin-bottom: 18px; }
          .studio-ingestion .studio-header-action { margin: 14px 0 0; }
          .studio-ingestion .studio-header-meta { margin-top: 14px; }
          .studio-ingestion .studio-workspace {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 0;
            overflow: visible;
          }
          .studio-ingestion .studio-panel + .studio-panel { border-left: 0; border-top: 1px solid var(--studio-line); }
          .studio-ingestion .studio-panel { overflow: visible; }
          .studio-ingestion .studio-panel-body { overflow: visible; }
          .studio-ingestion .studio-panel-head { position: static; }
          .studio-ingestion .studio-visual { grid-column: auto; }
          .studio-ingestion .studio-mode-grid { grid-template-columns: 1fr; }
          .studio-ingestion .studio-choice-head { display: block; }
          .studio-ingestion .studio-pills { justify-content: flex-start; margin-top: 11px; }
          .studio-ingestion .studio-error { position: static; margin-top: 18px; max-width: none; }
          .studio-ingestion .studio-command-inner { min-height: 58px; padding: 8px; }
          .studio-ingestion .studio-command-status { display: none; }
          .studio-ingestion .studio-build { width: 100%; }
        }
      `}</style>

      <div className="studio-page">
        <header className="studio-header">
          <div className="studio-header-main">
            <div className="studio-kicker">YourThumb / Thumbnail Studio</div>
            <h1 className="studio-title">Build the Thumbnail.</h1>
            <p className="studio-subtitle">
              Start with context. Creative direction second. Visual language third. Then build the Thumbnail.
            </p>
          </div>
          {hasViewableLastOutput && (
            <button
              type="button"
              className={cn(
                "studio-header-action",
                hasUnseenGeneratedThumbnail && "studio-header-action--attention"
              )}
              onClick={handleViewLastOutput}
              aria-label="View generated thumbnail"
            >
              <span>View Generated Thumbnail</span>
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <div className="studio-header-meta">
            <CanvaConnectionControl />
          </div>
        </header>

        <section className="studio-workspace">
          {/* 01 — existing creative brief fields, same state + handlers */}
          <section className="studio-panel">
            <div className="studio-panel-head">
              <div className="studio-panel-kicker">01 / Creative Brief</div>
              <div className="studio-panel-hint">Start with context</div>
            </div>
            <div
              className="studio-panel-body"
              onMouseMove={(event) => updateScrollHint("brief", event)}
              onMouseLeave={() =>
                setActiveScrollHint((current) => (current === "brief" ? null : current))
              }
              onScroll={(event) => handlePanelScroll("brief", event)}
            >
              <button
                type="button"
                className={cn(
                  "studio-scroll-hint",
                  activeScrollHint === "brief" && "active",
                )}
                aria-label="Scroll Creative Brief to bottom"
                title="Scroll to bottom"
                onClick={(event) => handleScrollHintToBottom("brief", event)}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <div className="studio-field">
                <div className="studio-field-label-row">
                  <label htmlFor="topic" className="studio-field-label">
                    VIDEO TOPIC <span className="studio-required">*</span>
                  </label>
                  <button
                    type="button"
                    className={cn(
                      "studio-help-button",
                      openBriefHelp === "topic" && "active",
                    )}
                    aria-label="Show Video Topic guidance"
                    aria-expanded={openBriefHelp === "topic"}
                    aria-controls="video-topic-help"
                    onClick={() =>
                      setOpenBriefHelp((current) =>
                        current === "topic" ? null : "topic"
                      )
                    }
                  >
                    <CircleHelp aria-hidden="true" />
                  </button>
                </div>
                {openBriefHelp === "topic" && (
                  <div id="video-topic-help" className="studio-help-popover">
                    <strong>VIDEO TOPIC</strong>
                    <span>
                      Give the strategist enough context to understand what the video is actually about before making the thumbnail direction.
                    </span>
                  </div>
                )}
                <textarea
                  id="topic"
                  maxLength={MAX_LONG_TEXT_CHARS}
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  onPaste={handleTopicPaste}
                  placeholder="Tell YourThumb what happens in the video..."
                  className={cn("studio-textarea", topicTooShort && "border-red-400")}
                  aria-invalid={topicTooShort}
                />
                <div className="studio-meta-row">
                  <span className={topicWords >= MIN_WORDS && !topicAtMax ? "studio-status-good" : topicTooShort ? "studio-status-bad" : ""}>
                    {topicWords} {topicWords === 1 ? "word" : "words"}
                  </span>
                  <span>·</span>
                  <span>10–300 words · {topic.length.toLocaleString()}/{MAX_LONG_TEXT_CHARS.toLocaleString()} characters</span>
                  {topicWords >= MIN_WORDS && !topicAtMax && <><span>·</span><span className="studio-status-good">GOOD LENGTH</span></>}
                  {topicAtMax && <><span>·</span><span className="studio-status-warn">300/300 WORDS · MAX LIMIT</span></>}
                  {topicTooShort && <><span>·</span><span className="studio-status-bad">ADD {MIN_WORDS - topicWords} MORE {MIN_WORDS - topicWords === 1 ? "WORD" : "WORDS"}</span></>}
                </div>
              </div>

              <div className="studio-field">
                <div className="studio-field-label-row">
                  <label htmlFor="thumbnail-idea" className="studio-field-label">
                    IDEA / ANGLE <span className="studio-optional-label">(OPTIONAL)</span>
                  </label>
                  <button
                    type="button"
                    className={cn(
                      "studio-help-button",
                      openBriefHelp === "angle" && "active",
                    )}
                    aria-label="Show Idea or Angle guidance"
                    aria-expanded={openBriefHelp === "angle"}
                    aria-controls="idea-angle-help"
                    onClick={() =>
                      setOpenBriefHelp((current) =>
                        current === "angle" ? null : "angle"
                      )
                    }
                  >
                    <CircleHelp aria-hidden="true" />
                  </button>
                </div>
                {openBriefHelp === "angle" && (
                  <div id="idea-angle-help" className="studio-help-popover">
                    <strong>IDEA / ANGLE</strong>
                    <span>
                      The angle can stay empty. The strategist will work from the video topic alone when no extra direction is supplied.
                    </span>
                  </div>
                )}
                <textarea
                  id="thumbnail-idea"
                  maxLength={MAX_LONG_TEXT_CHARS}
                  value={thumbnailIdea}
                  onChange={(e) => handleIdeaChange(e.target.value)}
                  onPaste={handleIdeaPaste}
                  placeholder="Describe the thumbnail idea, angle, or supporting video context you want the thumbnail to emphasise."
                  className="studio-textarea idea"
                />
                <div className="studio-meta-row">
                  <span>{ideaWords} {ideaWords === 1 ? "word" : "words"}</span>
                  <span>·</span>
                  <span>MAX 300 WORDS · {thumbnailIdea.length.toLocaleString()}/{MAX_LONG_TEXT_CHARS.toLocaleString()} CHARACTERS</span>
                  {ideaWords > 0 && !ideaAtMax && <><span>·</span><span className="studio-status-good">GOOD LENGTH</span></>}
                  {ideaAtMax && <><span>·</span><span className="studio-status-warn">300/300 WORDS · MAX LIMIT</span></>}
                </div>
              </div>
            </div>
          </section>

          {/* 02 — existing creative direction controls, same state + handlers */}
          <section className="studio-panel">
            <div className="studio-panel-head">
              <div className="studio-panel-kicker">02 / Visual Direction</div>
              <div className="studio-panel-hint">Shape the visual</div>
            </div>
            <div
              className="studio-panel-body studio-asset-stack"
              onMouseMove={(event) => updateScrollHint("direction", event)}
              onMouseLeave={() =>
                setActiveScrollHint((current) => (current === "direction" ? null : current))
              }
              onScroll={(event) => handlePanelScroll("direction", event)}
            >
              <button
                type="button"
                className={cn(
                  "studio-scroll-hint",
                  activeScrollHint === "direction" && "active",
                )}
                aria-label="Scroll Visual Direction to bottom"
                title="Scroll to bottom"
                onClick={(event) => handleScrollHintToBottom("direction", event)}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <div>
                <div className="studio-mode-label">CHOOSE THE WORKFLOW</div>
                <div className="studio-mode-grid">
                  <button type="button" onClick={() => setWorkflow("copycat")} className={cn("studio-mode", workflow === "copycat" && "active")}>
                    <div className="studio-mode-number">01</div>
                    <span className="studio-mode-title">Copycat Mode</span>
                    <span className="studio-mode-copy">Clone the layout & structure of 1 viral thumbnail.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWorkflow("frame"); setBackgroundMode("ai"); setBackgroundPrompt(""); setBackgroundFile([]); }}
                    className={cn("studio-mode", workflow === "frame" && "active")}
                  >
                    <div className="studio-mode-number">02</div>
                    <span className="studio-mode-title">Frame-Based</span>
                    <span className="studio-mode-copy">Use a video screenshot as the composition anchor.</span>
                  </button>
                  <button type="button" onClick={() => setWorkflow("asset")} className={cn("studio-mode", workflow === "asset" && "active")}>
                    <div className="studio-mode-number">03</div>
                    <span className="studio-mode-title">Asset-Based</span>
                    <span className="studio-mode-copy">Start from a blank canvas and supplied assets.</span>
                  </button>
                </div>
              </div>

              {workflow === "asset" && (
                <div className="studio-row">
                  <div>
                    <div className="studio-row-title">Include Human</div>
                    <div className="studio-row-copy">
                      {includeHuman
                        ? "Required: The final thumbnail must include a human subject."
                        : "Forbidden: No human subject may appear in the thumbnail."}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeHuman}
                    onClick={() => setIncludeHuman(!includeHuman)}
                    className={cn("studio-switch", includeHuman && "active")}
                  >
                    <span />
                  </button>
                </div>
              )}

              <div className="studio-choice">
                <div className="studio-choice-head">
                  <div>
                    <div className="studio-choice-title">Thumbnail Text</div>
                    <div className="studio-choice-copy">Let AI find the hook or supply your own.</div>
                  </div>
                  <div className="studio-pills">
                    <button
                      type="button"
                      onClick={() => { setThumbnailTextMode("auto"); setCustomThumbnailText(""); }}
                      className={cn("studio-pill", thumbnailTextMode === "auto" && "active")}
                    >AUTO</button>
                    <button
                      type="button"
                      onClick={() => setThumbnailTextMode("custom")}
                      className={cn("studio-pill", thumbnailTextMode === "custom" && "active")}
                    >CUSTOM</button>
                  </div>
                </div>

                {thumbnailTextMode === "custom" && (
                  <div className="studio-support">
                    <input
                      maxLength={MAX_THUMBNAIL_TEXT_CHARS}
                      value={customThumbnailText}
                      onChange={(e) => handleCustomTextChange(e.target.value)}
                      onPaste={handleCustomTextPaste}
                      placeholder="e.g. I QUIT!"
                      className={cn("studio-input", customTextInvalid && "border-red-400")}
                    />
                    <div className="studio-meta-row">
                      <span>{customTextWords} {customTextWords === 1 ? "word" : "words"}</span>
                      <span>·</span>
                      <span>MAX 3 WORDS · {customThumbnailText.length}/{MAX_THUMBNAIL_TEXT_CHARS} CHARACTERS</span>
                      {customTextWords > 0 && customTextWords <= MAX_THUMBNAIL_WORDS && <><span>·</span><span className="studio-status-good">GOOD LENGTH</span></>}
                      {customTextAtMax && <><span>·</span><span className="studio-status-warn">3/3 WORDS · MAX LIMIT</span></>}
                      {customTextInvalid && <><span>·</span><span className="studio-status-bad">ENTER 1–3 WORDS</span></>}
                    </div>
                  </div>
                )}
              </div>

              {workflow !== "frame" && (
                <div className="studio-choice">
                  <div className="studio-choice-head">
                    <div>
                      <div className="studio-choice-title">Thumbnail Background</div>
                      <div className="studio-choice-copy">Generate an environment or use an exact image.</div>
                    </div>
                    <div className="studio-pills">
                      <button type="button" onClick={() => setBackgroundMode("ai")} className={cn("studio-pill", backgroundMode === "ai" && "active")}>AI BACKGROUND</button>
                      <button type="button" onClick={() => setBackgroundMode("upload")} className={cn("studio-pill", backgroundMode === "upload" && "active")}>UPLOAD</button>
                    </div>
                  </div>

                  {backgroundMode === "ai" ? (
                    <div className="studio-support">
                      <input
                        maxLength={MAX_BACKGROUND_CHARS}
                        value={backgroundPrompt}
                        onChange={(e) => handleBackgroundPromptChange(e.target.value)}
                        onPaste={handleBackgroundPromptPaste}
                        placeholder="Describe the background YourThumb should build..."
                        className="studio-input"
                      />
                      <div className="studio-meta-row">
                        <span>{backgroundWords} {backgroundWords === 1 ? "word" : "words"}</span>
                        <span>·</span>
                        <span>OPTIONAL · MAX 300 WORDS · {backgroundPrompt.length.toLocaleString()}/{MAX_BACKGROUND_CHARS.toLocaleString()} CHARACTERS</span>
                        {backgroundWords > 0 && !backgroundAtMax && <><span>·</span><span className="studio-status-good">GOOD LENGTH</span></>}
                        {backgroundAtMax && <><span>·</span><span className="studio-status-warn">300/300 WORDS · MAX LIMIT</span></>}
                      </div>
                    </div>
                  ) : (
                    <div className="studio-upload-block studio-upload">
                      <FileDropzone
                        maxFiles={1}
                        bucket={STYLE_ANCHORS_BUCKET}
                        pathPrefix={`${userId}/screenshots`}
                        files={backgroundFile}
                        onFilesChange={setBackgroundFile}
                        label="Upload Custom Background"
                        hint="Upload 1 PNG, JPG, or WEBP image to be used as the base environment."
                        dropTitle="Drop your background image here"
                      />
                    </div>
                  )}
                </div>
              )}

              {workflow === "frame" && (
                <div className="studio-choice studio-frame-choice">
                  <div className="studio-choice-title">Foundational Frame</div>
                  <div className="studio-field">
                    <div className="studio-field-label-row">
                      <label htmlFor="frame-description" className="studio-field-label">
                        WHAT IS HAPPENING IN THIS FRAME <span className="studio-required">*</span>
                      </label>
                    </div>
                    <textarea
                      id="frame-description"
                      maxLength={MAX_LONG_TEXT_CHARS}
                      value={frameDescription}
                      onChange={(e) => handleFrameDescriptionChange(e.target.value)}
                      onPaste={handleFrameDescriptionPaste}
                      placeholder="Describe the specific moment, action, and relevant subjects visible in this frame..."
                      className={cn(
                        "studio-textarea frame-description",
                        (frameDescriptionTooShort || frameDescriptionInvalid) && "border-red-400"
                      )}
                      aria-invalid={frameDescriptionTooShort || frameDescriptionInvalid}
                      required
                    />
                    <div className="studio-meta-row">
                      <span className={frameDescriptionInvalid || frameDescriptionTooShort ? "studio-status-bad" : frameDescriptionWords >= MIN_WORDS ? "studio-status-good" : ""}>
                        {frameDescriptionWords} {frameDescriptionWords === 1 ? "word" : "words"}
                      </span>
                      <span>·</span>
                      <span>10–300 words · {frameDescription.length.toLocaleString()}/{MAX_LONG_TEXT_CHARS.toLocaleString()} characters</span>
                      {frameDescriptionWords >= MIN_WORDS && frameDescriptionWords < MAX_WORDS && (
                        <><span>·</span><span className="studio-status-good">GOOD LENGTH</span></>
                      )}
                      {frameDescriptionWords >= MAX_WORDS && (
                        <><span>·</span><span className="studio-status-warn">300/300 WORDS · MAX LIMIT</span></>
                      )}
                      {frameDescriptionTooLong && (
                        <><span>·</span><span className="studio-status-bad">REDUCE TO {MAX_WORDS} WORDS</span></>
                      )}
                      {frameDescriptionTooShort && (
                        <><span>·</span><span className="studio-status-bad">ADD {MIN_WORDS - frameDescriptionWords} MORE {MIN_WORDS - frameDescriptionWords === 1 ? "WORD" : "WORDS"}</span></>
                      )}
                      {frameDescriptionInvalid && (
                        <><span>·</span><span className="studio-status-bad">DESCRIBE THE FRAME</span></>
                      )}
                    </div>
                  </div>

                  <div className="studio-support studio-upload">
                    <FileDropzone
                      maxFiles={1}
                      bucket={STYLE_ANCHORS_BUCKET}
                      pathPrefix={`${userId}/screenshots`}
                      files={frameFile}
                      onFilesChange={setFrameFile}
                      label="FOUNDATIONAL FRAME"
                      hint="Upload a video screenshot or frame to use as your composition anchor."
                      dropTitle="Drop your foundational frame here"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 03 — existing references and last output. No persistence/validation changes. */}
          <section className="studio-panel studio-visual">
            <div className="studio-panel-head">
              <div className="studio-panel-kicker-row">
                <div className="studio-panel-kicker">03 / Visual Language</div>
                <button
                  type="button"
                  className={cn(
                    "studio-help-button",
                    openVisualHelp && "active",
                  )}
                  aria-label="Show Visual Language guidance"
                  aria-expanded={openVisualHelp}
                  aria-controls="visual-language-help"
                  onClick={() => setOpenVisualHelp((current) => !current)}
                >
                  <CircleHelp aria-hidden="true" />
                </button>
              </div>
              <div className="studio-panel-hint">Build the visual language</div>
            </div>
            <div
              className="studio-panel-body"
              onMouseMove={(event) => updateScrollHint("visual", event)}
              onMouseLeave={() =>
                setActiveScrollHint((current) => (current === "visual" ? null : current))
              }
              onScroll={(event) => handlePanelScroll("visual", event)}
            >
              <button
                type="button"
                className={cn(
                  "studio-scroll-hint",
                  activeScrollHint === "visual" && "active",
                )}
                aria-label="Scroll Visual Language to bottom"
                title="Scroll to bottom"
                onClick={(event) => handleScrollHintToBottom("visual", event)}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              {openVisualHelp && (
                <div id="visual-language-help" className="studio-help-popover studio-panel-help-popover">
                  <strong>VISUAL LANGUAGE</strong>
                  <span>
                    Give the strategist visual evidence. In Copycat, Style Ref 1 is the structural master; the other slots add visual language.
                  </span>
                </div>
              )}

              <div className="studio-reference-shell studio-upload">
                {workflow === "copycat" ? (
                  <FileDropzone
                    maxFiles={1}
                    bucket={STYLE_ANCHORS_BUCKET}
                    pathPrefix={`${userId}/thumbnails`}
                    files={inspirationFiles.slice(0, 1)}
                    onFilesChange={(files, changedIndices) => {
                      const next = [...referenceSlotsRef.current];
                      const indices = changedIndices?.length ? changedIndices : [0];
                      for (const index of indices) {
                        if (index >= 0 && index < 3) {
                          next[index] = files[index] ?? null;
                        }
                      }
                      while (next.length < 3) next.push(null);
                      next.length = 3;
                      void handleInspirationFilesChange(next, indices);
                    }}
                    label="Reference Thumbnail to Clone *"
                    hint="Upload 1 high-performing YouTube thumbnail. The AI will clone its layout, geometry, and scaling."
                    dropTitle="Drop 1 reference thumbnail to copy"
                    previewClassName="studio-copycat-reference-preview"
                  />
                ) : (
                  <FileDropzone
                    variant="slots"
                    maxFiles={3}
                    bucket={STYLE_ANCHORS_BUCKET}
                    pathPrefix={`${userId}/thumbnails`}
                    files={inspirationFiles}
                    onFilesChange={handleInspirationFilesChange}
                    label="Inspiration Thumbnails (Style Anchors) *"
                    hint="Upload at least 1 reference thumbnail."
                    slotLabels={["Reference 1 (Required)", "Reference 2            ", "Reference 3       "]}
                  />
                )}
              </div>

              <div ref={lastOutputRef} className="studio-last-output">
                <div className="studio-last-top">
                  <div className="studio-last-title">Last Output</div>
                  <div className="studio-retention">AVAILABLE FOR 30 DAYS</div>
                </div>
                {hasViewableLastOutput ? (
                  <DeliverableView
                    imageUrl={generation?.final_image_url ?? lastImageUrl ?? ""}
                    title={generation?.selected_title ?? null}
                    generation={generation?.status === "COMPLETED" ? generation : undefined}
                    onQueued={(nextGen) => {
                      setGeneration(nextGen);
                      setCheckpointOpen(true);
                    }}
                    studio
                  />
                ) : (
                  <div className="studio-empty-output">
                    <div>
                      <strong>Your latest thumbnail will appear here.</strong>
                      <span>Nothing is stored here as a gallery. YourThumb keeps only the most recent generated thumbnail.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>

      {error && <p role="alert" className="studio-error">{error}</p>}

      <div className="studio-command">
        <div className="studio-command-inner">
          <div className="studio-command-status">
            <span className="studio-dot" />
            <strong>{canSubmit ? "READY TO BUILD" : "COMPLETE THE BRIEF"}</strong>
            <span className="studio-command-note">1 GENERATION WILL BE USED</span>
          </div>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="studio-build">
            {submitting ? "Generating…" : canSubmit ? "BUILD THUMBNAIL →" : "BUILD THUMBNAIL"}
          </button>
        </div>
      </div>

      <CheckpointModal
        open={checkpointOpen}
        onOpenChange={setCheckpointOpen}
        generation={generation}
        ideating={submitting}
        onGenerationChange={setGeneration}
        onAbandon={handleAbandonGeneration}
        onDeliverable={(url, record) => {
          setGeneration(record);
          setLastImageUrl(url);
          setHasUnseenGeneratedThumbnail(true);
          persistLastGeneratedImageUrl(url, userId);
        }}
      />

    </div>
  );
}
