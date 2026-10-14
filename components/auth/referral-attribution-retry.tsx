"use client";

import { useEffect } from "react";

export function ReferralAttributionRetry() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt += 1) {
        try {
          const response = await fetch("/api/referrals/attribution/retry", {
            method: "POST",
            cache: "no-store",
          });

          if (response.ok || response.status === 401) return;
        } catch (error) {
          console.warn("[referral] attribution retry request failed", error);
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
