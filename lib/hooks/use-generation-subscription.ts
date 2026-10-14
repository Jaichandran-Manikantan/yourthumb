"use client";

import { useEffect, useState } from "react";
import { persistLastGeneratedImageUrl } from "@/lib/generation/last-image";
import { createClient } from "@/lib/supabase/client";
import type { GenerationRecord, GenerationStatus } from "@/lib/types/generation";

const INITIAL_POLLING_INTERVAL_MS = 3_000;
const MAX_POLLING_INTERVAL_MS = 15_000;

export function useGenerationSubscription(
  generationId: string | null,
  initial?: GenerationRecord | null,
  userId?: string | null
) {
  const [generation, setGeneration] = useState<GenerationRecord | null>(
    initial ?? null
  );

  useEffect(() => {
    setGeneration(initial ?? null);
  }, [initial, generationId]);

  // 1. Supabase Realtime WebSocket Connection (Unique channel per subscriber)
  useEffect(() => {
    if (!generationId) return;

    const supabase = createClient();
    const channelId = `generation-${generationId}-${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "generations",
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          const next = payload.new as GenerationRecord | undefined;
          if (next?.id) {
            setGeneration((prev) => ({ ...(prev ?? {}), ...next }));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [generationId]);

  // 2. HTTP Polling Fallback
  // The database is the source of truth. The browser never invents a FAILED
  // state merely because an image took longer than expected. A slow render
  // remains PROCESSING until the worker or the recovery path changes it.
  useEffect(() => {
    const isFinished =
      generation?.status === "COMPLETED" ||
      generation?.status === "FAILED" ||
      generation?.status === "FAILED_TOS" ||
      generation?.status === "ABANDONED" ||
      generation?.status === "EXPIRED";

    if (!generationId || isFinished) return;

    let delayMs = INITIAL_POLLING_INTERVAL_MS;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .single();

      if (!error && data) {
        setGeneration((prev) => ({ ...(prev ?? {}), ...data }));
        delayMs = INITIAL_POLLING_INTERVAL_MS;
      } else {
        delayMs = Math.min(delayMs * 2, MAX_POLLING_INTERVAL_MS);
      }

      timer = setTimeout(poll, delayMs);
    };

    timer = setTimeout(poll, delayMs);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [generationId, generation?.status]);

  // 3. Save Final Render to Local State
  useEffect(() => {
    const url = generation?.final_image_url;
    if (generation?.status !== "COMPLETED" || !url) return;
    persistLastGeneratedImageUrl(url, userId ?? generation?.user_id ?? initial?.user_id ?? "");
  }, [generation?.status, generation?.final_image_url]);

  const status = (generation?.status ?? "PENDING") as GenerationStatus;

  return {
    generation,
    setGeneration,
    status,
    finalImageUrl: generation?.final_image_url ?? null,
    isProcessing: status === "PROCESSING",
    isCompleted: status === "COMPLETED",
    isFailed: status === "FAILED" || status === "FAILED_TOS",
  };
}