"use server";

import { createClient } from "@/lib/supabase/server";

const GENERATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export async function getResumableGeneration() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();

  /*
   * The database expiry timestamp is the source of truth. This keeps the
   * 24-hour session consistent across devices and browsers.
   *
   * The created_at fallback below is only for legacy rows created before
   * expires_at was introduced.
   */
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["PENDING", "CHECKPOINT", "PROCESSING", "COMPLETED"])
    .or(`expires_at.gt.${now},expires_at.is.null`)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[generation] failed to load resumable generation", error);
    return null;
  }

  const resumable = (data ?? [])[0] ?? null;

  if (!resumable) return null;

  /* Legacy expiry fallback remains the source of truth for old rows. */
  const isActiveAndUnexpired = (row: typeof resumable) => {
    const expiresAt = row.expires_at
      ? new Date(row.expires_at).getTime()
      : new Date(row.created_at).getTime() + GENERATION_LIFETIME_MS;

    return expiresAt > Date.now();
  };

  if (!isActiveAndUnexpired(resumable)) return null;

  // Frame generations created before the mandatory frame-description field
  // was introduced are not safely resumable. Exclude them so they cannot
  // trigger repeated invalid /api/ideate recovery requests or block the UI.
  if (
    resumable.workflow === "FRAME" &&
    !resumable.frame_description?.trim()
  ) {
    return null;
  }

  return resumable;
}
