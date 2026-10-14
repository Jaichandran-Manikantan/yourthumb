export const REFERRAL_COOKIE_NAME = "yourthumb_referral";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const FALLBACK_SECRET_ENV = "SUPABASE_SERVICE_ROLE_KEY";

function getSecret() {
  const secret =
    process.env.REFERRAL_COOKIE_SECRET || process.env[FALLBACK_SECRET_ENV];
  if (!secret) {
    throw new Error("Referral cookie signing secret is not configured");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===";
  const binary = atob(padded.slice(0, padded.length - (padded.length % 4)));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toBase64Url(new Uint8Array(signature));
}

async function signaturesMatch(expected: string, actual: string) {
  const a = fromBase64Url(expected);
  const b = fromBase64Url(actual);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

export type ReferralCookieValue = {
  code: string;
  startedAtMs: number;
};

export function isValidReferralCode(value: string | null | undefined) {
  return /^[A-F0-9]{8}$/.test(String(value ?? "").trim().toUpperCase());
}

export function normalizeReferralCode(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return isValidReferralCode(code) ? code : null;
}

export async function createReferralCookieValue(
  code: string,
  startedAtMs = Date.now()
) {
  const normalized = normalizeReferralCode(code);
  if (!normalized || !Number.isFinite(startedAtMs)) return null;
  const payload = `${normalized}|${Math.floor(startedAtMs)}`;
  const signature = await sign(payload);
  return toBase64Url(
    new TextEncoder().encode(`${payload}|${signature}`)
  );
}

export async function parseReferralCookieValue(
  value: string | undefined | null
) {
  if (!value) return null;

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(value));
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;

    const [rawCode, rawStartedAt, rawSignature] = parts;
    const code = normalizeReferralCode(rawCode);
    const startedAtMs = Number(rawStartedAt);
    if (
      !code ||
      !Number.isFinite(startedAtMs) ||
      !/^[A-Za-z0-9_-]+$/.test(rawSignature)
    ) {
      return null;
    }

    const payload = `${code}|${Math.floor(startedAtMs)}`;
    const expected = await sign(payload);
    if (!(await signaturesMatch(expected, rawSignature))) return null;

    const ageMs = Date.now() - startedAtMs;
    if (
      ageMs < -60_000 ||
      ageMs > REFERRAL_COOKIE_MAX_AGE_SECONDS * 1000
    ) {
      return null;
    }

    return { code, startedAtMs } satisfies ReferralCookieValue;
  } catch {
    return null;
  }
}
