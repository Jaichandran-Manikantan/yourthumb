export const DEFAULT_EXTERNAL_FETCH_TIMEOUT_MS = 15_000;

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function timeoutError(timeoutMs: number): Error {
  return new Error(`External request timed out after ${timeoutMs}ms`);
}

/**
 * Fetch with a hard deadline for establishing/receiving the response headers.
 * The returned Response must use one of the timed body readers below when the
 * caller needs the body, otherwise a slow body stream can outlive this timer.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_EXTERNAL_FETCH_TIMEOUT_MS
): Promise<Response> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive finite number");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw timeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readBodyWithTimeout<T>(
  response: Response,
  reader: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive finite number");
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  try {
    return await Promise.race([
      reader(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          void response.body?.cancel();
          reject(timeoutError(timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (timedOut) throw error;
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function readResponseTextWithTimeout(
  response: Response,
  timeoutMs: number = DEFAULT_EXTERNAL_FETCH_TIMEOUT_MS
): Promise<string> {
  return readBodyWithTimeout(response, () => response.text(), timeoutMs);
}

export function readResponseArrayBufferWithTimeout(
  response: Response,
  timeoutMs: number = DEFAULT_EXTERNAL_FETCH_TIMEOUT_MS
): Promise<ArrayBuffer> {
  return readBodyWithTimeout(
    response,
    () => response.arrayBuffer(),
    timeoutMs
  );
}

export async function readResponseJsonWithTimeout<T = unknown>(
  response: Response,
  timeoutMs: number = DEFAULT_EXTERNAL_FETCH_TIMEOUT_MS
): Promise<T> {
  const text = await readResponseTextWithTimeout(response, timeoutMs);
  return JSON.parse(text) as T;
}
