"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { exportThumbnailToCanva } from "./canva-export-client";

type ResumePayload = {
  generationId?: string;
  imageUrl?: string;
  title?: string;
};

type ResumeResponse = {
  resume?: ResumePayload | null;
  error?: string;
};

function authorizationErrorMessage(code: string | null) {
  if (code === "access_denied") {
    return "Canva authorization was cancelled. Return to YourThumb and try again when you're ready.";
  }
  if (code === "missing_oauth_state") {
    return "The Canva connection timed out or could not be verified. Please start again from YourThumb.";
  }
  if (code === "token_exchange_failed") {
    return "Canva could not finish connecting to YourThumb. Please try again.";
  }
  if (code === "unauthorized") {
    return "Your YourThumb session has expired. Sign in again, then retry the Canva action.";
  }
  return code
    ? "Canva authorization did not complete. Return to YourThumb and try again."
    : null;
}

export function CanvaContinueClient() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function continueToCanva() {
      const currentUrl = new URL(window.location.href);
      const authError = authorizationErrorMessage(currentUrl.searchParams.get("canva_error"));
      if (authError) {
        setError(authError);
        return;
      }

      // Let the original YourThumb tab refresh its connection indicator, when
      // the browser retains window.opener across the provider's OAuth redirect.
      try {
        window.opener?.postMessage(
          { type: "yourthumb:canva-connected" },
          window.location.origin,
        );
      } catch {
        // The export flow must still work if the opener is unavailable.
      }

      try {
        const response = await fetch("/api/canva/resume", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as ResumeResponse;
        if (!response.ok) throw new Error(payload.error ?? "Could not resume the selected thumbnail.");
        if (!payload.resume) {
          throw new Error("The selected thumbnail could not be restored. Return to YourThumb and click its Canva icon again.");
        }

        const editUrl = await exportThumbnailToCanva(payload.resume);
        if (!cancelled) window.location.replace(editUrl);
      } catch (resumeError) {
        console.error("Could not resume selected Canva thumbnail:", resumeError);
        if (!cancelled) {
          setError(
            resumeError instanceof Error
              ? resumeError.message
              : "Could not open the selected thumbnail in Canva. Return to YourThumb and try again.",
          );
        }
      }
    }

    void continueToCanva();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0a09] px-5 py-12 text-[#f6f1e8]">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141210] p-7 text-center shadow-2xl sm:p-9" aria-live="polite">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          {error ? (
            <AlertCircle className="h-5 w-5 text-rose-300" aria-hidden="true" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-rose-300" aria-hidden="true" />
          )}
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {error ? "Could not open Canva" : "Opening your thumbnail in Canva…"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#b5aca1]">
          {error ?? "Your Canva account is connected. We're preparing the selected thumbnail now."}
        </p>
        {error && (
          <a
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.06]"
            href="/dashboard"
          >
            Return to YourThumb <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </section>
    </main>
  );
}
