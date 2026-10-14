"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, type AppToast, dismiss } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [items, setItems] = useState<AppToast[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-sm",
            item.kind === "error"
              ? "border-destructive/40 bg-destructive text-white"
              : "border-border bg-background text-foreground"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{item.message}</p>
            <button
              type="button"
              data-allow-offline=""
              className="shrink-0 text-xs opacity-80 hover:opacity-100"
              onClick={() => dismiss(item.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
