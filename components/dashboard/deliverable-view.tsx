"use client";

import { Copy, Download, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextTweakModal } from "./text-tweak-modal";
import { WaveDots } from "./wave-dots";
import { useGenerationSubscription } from "@/lib/hooks/use-generation-subscription";
import { CanvaNotConnectedError, exportThumbnailToCanva } from "./canva-export-client";
import type { GenerationRecord } from "@/lib/types/generation";

const STUDIO_DELIVERABLE_STYLES = [
  "",
  "          .studio-deliverable .studio-deliverable-actions [data-slot=\"button\"] {",
  "            border-color: rgba(255,244,228,.15);",
  "            background: rgba(255,255,255,.03);",
  "            color: #e8dfd3;",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions .studio-icon-button {",
  "            width: 38px;",
  "            height: 38px;",
  "            padding: 0;",
  "            justify-content: center;",
  "            border-radius: 9px;",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions [data-slot=\"button\"]:hover:not(:disabled) {",
  "            background: rgba(255,255,255,.075);",
  "            color: #fffaf1;",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions .studio-canva-button {",
  "            width: 42px;",
  "            height: 42px;",
  "            padding: 0;",
  "            justify-content: center;",
  "            border-radius: 10px;",
  "            border-color: rgba(255,244,228,.15);",
  "            background: #141210;",
  "            color: #f6f1e8;",
  "            box-shadow: inset 0 0 0 1px rgba(255,255,255,.015);",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions .studio-canva-button:hover:not(:disabled) {",
  "            border-color: rgba(255,82,107,.42);",
  "            background: rgba(255,82,107,.06);",
  "            color: #fffaf1;",
  "            box-shadow: inset 0 0 0 1px rgba(255,82,107,.08), 0 0 0 1px rgba(255,82,107,.04);",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions .studio-edit-text-button {",
  "            min-width: 58px;",
  "            height: 38px;",
  "            padding: 0 14px;",
  "            border-color: rgba(255,82,107,.30);",
  "            background: rgba(255,82,107,.07);",
  "            color: #ffc4cd;",
  "            font-weight: 700;",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions .studio-edit-text-button:hover:not(:disabled) {",
  "            border-color: rgba(255,116,136,.58);",
  "            background: rgba(255,82,107,.13);",
  "            color: #fff2f4;",
  "          }",
  "          .studio-deliverable .studio-deliverable-actions [data-slot=\"button\"]:disabled {",
  "            opacity: .48;",
  "          }",
  "          .studio-deliverable [data-slot=\"card\"] {",
  "            border-color: rgba(255,244,228,.10);",
  "            background: #141210;",
  "            box-shadow: none;",
  "          }",
  "        "
].join("\n");

export function DeliverableView({
  imageUrl: initialImageUrl,
  title,
  generation: initialGeneration,
  onQueued,
  studio = false,
}: {
  imageUrl: string;
  title?: string | null;
  generation?: GenerationRecord;
  onQueued?: (next: GenerationRecord) => void;
  studio?: boolean;
}) {
  const { generation, finalImageUrl, isProcessing } = useGenerationSubscription(
    initialGeneration?.id ?? null,
    initialGeneration,
    initialGeneration?.user_id ?? null
  );

  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const rawActiveUrl = finalImageUrl || generation?.final_image_url || initialImageUrl;
  const activeImageUrl = rawActiveUrl || "";
  const activeTitle = generation?.selected_title || title;

  async function handleDownload() {
    try {
      const res = await fetch(activeImageUrl);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "yourthumb-thumbnail.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(activeImageUrl, "_blank");
    }
  }

  async function handleEditInCanva() {
    setExportError(null);
    setExporting(true);

    // Open a tab synchronously from the user gesture. If the account is not
    // connected, keep this same tab through OAuth so the selected thumbnail can
    // resume its export after Canva redirects back to YourThumb.
    const popup = window.open("about:blank", "_blank");
    const navigatePopup = (url: string) => {
      if (!popup || popup.closed) {
        throw new Error("Please allow pop-ups for Canva and try again.");
      }
      popup.location.href = url;
    };

    const generationId = generation?.id ?? initialGeneration?.id;
    const input = {
      ...(generationId ? { generationId } : {}),
      ...(!generationId && activeImageUrl ? { imageUrl: activeImageUrl } : {}),
      title: activeTitle ?? "YouTube Thumbnail",
    };

    try {
      if (!generationId && !activeImageUrl) {
        throw new Error("This thumbnail is not available for Canva export yet.");
      }

      try {
        const editUrl = await exportThumbnailToCanva(input);
        navigatePopup(editUrl);
      } catch (error) {
        if (!(error instanceof CanvaNotConnectedError)) throw error;

        const authorizationUrl = new URL("/api/auth/canva", window.location.origin);
        if (generationId) authorizationUrl.searchParams.set("generationId", generationId);
        else if (activeImageUrl) authorizationUrl.searchParams.set("imageUrl", activeImageUrl);
        authorizationUrl.searchParams.set("title", input.title);
        navigatePopup(authorizationUrl.toString());
      }
    } catch (error) {
      popup?.close();
      setExportError(error instanceof Error ? error.message : "Could not export to Canva.");
    } finally {
      setExporting(false);
    }
  }

  async function handleCopyTitle() {
    if (!activeTitle) return;
    await navigator.clipboard.writeText(activeTitle);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      {studio && (
        <style dangerouslySetInnerHTML={{ __html: STUDIO_DELIVERABLE_STYLES }} />
      )}

      <Card
        className={studio
          ? "studio-deliverable gap-0 rounded-[10px] border-white/10 bg-[#141210] p-0 text-[#f6f1e8] shadow-none"
          : "gap-0 p-0 shadow-sm"}
      >
        <div
          className={studio
            ? "flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800"}
        >
          <h2 className={studio ? "text-sm font-semibold text-[#f3ede4]" : "text-lg font-semibold"}>
            {isProcessing ? "Rendering your text tweak..." : "Your thumbnail is ready"}
          </h2>
          <div className="studio-deliverable-actions flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isProcessing}
              aria-label="Download thumbnail"
              title="Download thumbnail"
              className={studio ? "studio-icon-button" : ""}
            >
              <Download className="size-4" />
            </Button>
            <Button
              onClick={handleEditInCanva}
              disabled={exporting || isProcessing}
              aria-label="Edit in Canva"
              title="Edit in Canva"
              className={studio
                ? "studio-canva-button studio-icon-button font-semibold"
                : "bg-purple-600 font-semibold text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <img
                  src="/canva-logo-exact.png"
                  alt=""
                  aria-hidden="true"
                  className="size-[28px] rounded-full object-cover"
                />
              )}
            </Button>
            {generation && (
              <TextTweakModal generation={generation} onQueued={onQueued} studio={studio} />
            )}
            {activeTitle && (
              <Button variant="outline" onClick={handleCopyTitle} disabled={isProcessing}>
                {copied ? (
                  <Check className="mr-1.5 size-4" />
                ) : (
                  <Copy className="mr-1.5 size-4" />
                )}
                {copied ? "Copied" : "Copy title"}
              </Button>
            )}
          </div>
        </div>

        <div className={studio ? "p-4" : "p-6"}>
          <div className={studio
            ? "overflow-hidden rounded-[10px] border border-white/10 bg-[#0d0c0b] shadow-inner"
            : "overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-inner dark:border-zinc-800"}>
          {isProcessing ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center bg-zinc-900/5 p-6">
              <WaveDots label="Applying your text adjustments..." />
            </div>
          ) : (
            <img
              src={activeImageUrl}
              alt={activeTitle ?? "Rendered thumbnail"}
              className="aspect-video w-full object-cover transition-all duration-300"
            />
          )}
        </div>

        {/* Canva Magic Layers Pro-Tip Box */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="font-semibold">How to edit layers in Canva:</p>
            <p className="mt-0.5 opacity-90">
              Open Canva &rarr; Upload Thumbnail &rarr; Select the image &rarr; Click <strong>Edit</strong> &rarr; Select <strong>Magic Layers</strong> to separate the thumbnail into movable text, cut-out subjects, and background elements!
            </p>
          </div>
        </div>

        {activeTitle && (
          <p className={studio ? "mt-3 text-sm font-medium text-[#e4dbcf]" : "mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"}>
            {activeTitle}
          </p>
        )}

        {exportError && (
          <p role="alert" className={studio ? "mt-3 text-sm text-[#ff9baa]" : "mt-3 text-sm text-destructive"}>
            {exportError}
          </p>
        )}

        {generation?.tweak_error && !isProcessing && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <p className="font-semibold">
              That text tweak didn&apos;t work — your original thumbnail is safe.
            </p>
            <p className="mt-1 text-xs opacity-90">
              Your original thumbnail is still shown above. The failed tweak did not use another generation credit.
              You can try a different tweak while you still have a free edit remaining.
            </p>
            <p className="mt-1 text-xs opacity-75">
              {generation.tweak_error.length > 280
                ? `${generation.tweak_error.slice(0, 280)}…`
                : generation.tweak_error}
            </p>
          </div>
        )}
      </div>
    </Card>
    </>
  );
}   