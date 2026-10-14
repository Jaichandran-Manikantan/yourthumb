"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_RENDER_TWEAKS } from "@/lib/ideate/constants";
import type { GenerationRecord } from "@/lib/types/generation";

export function TextTweakModal({
  generation,
  onQueued,
  studio = false,
}: {
  generation: GenerationRecord;
  onQueued?: (next: GenerationRecord) => void;
  studio?: boolean;
}) {
  const used = generation.render_retry_count ?? 0;
  const remaining = Math.max(0, MAX_RENDER_TWEAKS - used);
  const [open, setOpen] = useState(false);
  const [tweak, setTweak] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const value = tweak.trim();
    if (!value || remaining <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: generation.id,
          tweakPrompt: value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to queue text tweak");
      }
      
      // Update parent component with the newly processing generation state
      if (data.generation) {
        onQueued?.(data.generation as GenerationRecord);
      }
      
      setOpen(false);
      setTweak("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue tweak");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={remaining <= 0}
        aria-label="Edit thumbnail text"
        title="Edit thumbnail text"
        className={studio ? "studio-edit-text-button" : ""}
      >
        {!studio && <Pencil className="mr-1.5 size-4" />}
        {studio ? "Edit" : `Retry with text adjustments (${remaining} ${remaining === 1 ? "edit" : "edits"} left)`}
      </Button>

      <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
        <DialogContent className="studio-dialog-content studio-text-tweak sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Minor text tweak</DialogTitle>
            <DialogDescription>
              Adjust thumbnail wording or a small prompt detail. This re-renders
              for free and does not use another generation credit. {remaining} of{" "}
              {MAX_RENDER_TWEAKS} free {MAX_RENDER_TWEAKS === 1 ? "edit" : "edits"} remaining.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            placeholder="e.g. Make the on-image text say I QUIT instead of DONE. Keep the same composition."
            className="min-h-24"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {tweak.length}/500 characters
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitting || tweak.trim().length === 0}
            >
              {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Re-render
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}