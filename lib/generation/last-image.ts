export const LAST_GENERATED_IMAGE_KEY = "last_generated_image_url";
export const LEGACY_LAST_GENERATED_IMAGE_KEY = "last_generated_image_url";
const THUMBNAIL_RETENTION_MS = 720 * 60 * 60 * 1000;

type StoredLastImage = {
  url: string;
  savedAt: number;
};

function scopedKey(userId: string): string {
  return `${LAST_GENERATED_IMAGE_KEY}:${userId}`;
}

export function readLastGeneratedImageUrl(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;

  // Never read the legacy global key: it may belong to another signed-in user
  // on a shared browser. Remove it once so older versions cannot leak it.
  window.localStorage.removeItem(LEGACY_LAST_GENERATED_IMAGE_KEY);

  const key = scopedKey(userId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredLastImage;

    if (
      !parsed ||
      typeof parsed.url !== "string" ||
      typeof parsed.savedAt !== "number"
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.savedAt >= THUMBNAIL_RETENTION_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.url;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function persistLastGeneratedImageUrl(url: string, userId: string): void {
  if (typeof window === "undefined" || !userId) return;

  // Remove the pre-namespacing key so an older browser state can never be
  // shown to a different account.
  window.localStorage.removeItem(LEGACY_LAST_GENERATED_IMAGE_KEY);

  const value: StoredLastImage = {
    url,
    savedAt: Date.now(),
  };

  window.localStorage.setItem(
    scopedKey(userId),
    JSON.stringify(value)
  );
}

export function clearLastGeneratedImageUrl(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.removeItem(scopedKey(userId));
  window.localStorage.removeItem(LEGACY_LAST_GENERATED_IMAGE_KEY);
}
