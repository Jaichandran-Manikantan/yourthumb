"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HumanCheckpoint } from "./human-checkpoint";
import { WaveDots } from "./wave-dots";
import type { GenerationRecord } from "@/lib/types/generation";
import { X } from "lucide-react";

export function CheckpointModal({
  open,
  onOpenChange,
  generation,
  ideating,
  onGenerationChange,
  onDeliverable,
  onAbandon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generation: GenerationRecord | null;
  ideating: boolean;
  onGenerationChange: (next: GenerationRecord) => void;
  onDeliverable: (url: string, record: GenerationRecord) => void;
  onAbandon: () => Promise<void>;
}) {
  const isIdeating =
    ideating ||
    (generation?.status === "PENDING" &&
      !generation?.title_options?.length &&
      !generation?.viral_titles?.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // X is the only intentional exit switch. Escape and backdrop clicks
        // must not silently close an active generation or bypass the abandon
        // policy. Parent-driven close remains possible through the `open` prop.
        if (nextOpen) onOpenChange(true);
      }}
    >
      <DialogContent
        className="studio-dialog-content max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <button
          type="button"
          aria-label="Discard generation"
          onClick={() => {
            // X is the user's only intentional exit switch. It also works
            // while PROCESSING; the server records ABANDONED with no refund.
            void onAbandon();
          }}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-[#90877b] transition-colors hover:bg-white/[.05] hover:text-[#f6f1e8]"
        >
          <X className="size-5" />
        </button>

        <DialogHeader className="pr-10">
          <DialogTitle>Human Checkpoint</DialogTitle>
          <DialogDescription>
            {generation?.workflow === "FRAME"
              ? "Review your viral titles and visual concept, then render. Your uploaded video frame is the visual foundation, so no extra staging assets are needed."
              : "Review your viral titles and visual concept, then upload or generate the required staging assets before rendering."}
          </DialogDescription>
        </DialogHeader>

        {isIdeating ? (
          <div className="studio-checkpoint">
            <WaveDots label="Ideating..." />
          </div>
        ) : generation ? (
          <div className="studio-checkpoint">
          <HumanCheckpoint
            generation={generation}
            onGenerationChange={onGenerationChange}
            onDeliverable={(url, record) => {
              onDeliverable(url, record);
              onOpenChange(false);
            }}
          />
          </div>
        ) : (
          <div className="studio-checkpoint">
            <WaveDots label="Ideating..." />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
