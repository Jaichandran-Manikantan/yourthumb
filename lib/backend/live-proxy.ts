/**
 * YourThumb public repository: fixed-origin API proxy.
 *
 * TRADE_SECRET: proprietary API handlers execute only on the hosted backend.
 * This module forwards requests to the official host; it does not contain prompts,
 * generation logic, payment fulfillment, worker orchestration, or webhook secrets.
 *
 * Do not turn this into a generic URL proxy. The destination path is supplied by
 * each route file and the hostname is pinned to yourthumb.tech (including its
 * subdomains for controlled staging). Only necessary request headers are copied.
 */
const DEFAULT_BACKEND_URL = "https://yourthumb.tech";
const MAX_PROXY_BODY_BYTES = 32 * 1024 * 1024;
const REQUEST_HEADERS = [
  "accept",
  "content-type",
  "cookie",
  "authorization",
  "if-none-match",
  "if-modified-since",
  "x-idempotency-key",
  "x-supabase-api-version",
  "x-client-info",
] as const;
const RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "content-disposition",
  "location",
  "etag",
  "last-modified",
  "retry-after",
  "vary",
  "www-authenticate",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
] as const;

function getOfficialBackendBase(): URL {
  const configured = (process.env.YOURTHUMB_LIVE_BACKEND_URL || DEFAULT_BACKEND_URL).trim();
  const base = new URL(configured);
  const host = base.hostname.toLowerCase();
  const isOfficialHost = host === "yourthumb.tech" || host.endsWith(".yourthumb.tech");
  if (
    base.protocol !== "https:" ||
    !isOfficialHost ||
    base.username ||
    base.password ||
    base.pathname !== "/" ||
    base.search ||
    base.hash
  ) {
    throw new Error("YOURTHUMB_LIVE_BACKEND_URL must be an HTTPS yourthumb.tech origin.");
  }
  return base;
}

export async function proxyLiveBackend(request: Request, fixedPath: string): Promise<Response> {
  // Prevent callers from choosing arbitrary paths or an arbitrary upstream host.
  if (!fixedPath.startsWith("/api/") || fixedPath.includes("..") || fixedPath.includes("?")) {
    return Response.json({ error: "Invalid backend route." }, { status: 500 });
  }

  let backend: URL;
  try {
    backend = getOfficialBackendBase();
  } catch {
    return Response.json({ error: "Live backend configuration is invalid." }, { status: 503 });
  }

  const incoming = new URL(request.url);
  const target = new URL(fixedPath, backend);
  target.search = incoming.search;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (!(["GET", "HEAD"].includes(request.method.toUpperCase()))) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_PROXY_BODY_BYTES) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
    try {
      body = await request.arrayBuffer();
    } catch {
      return Response.json({ error: "Unable to read request body." }, { status: 400 });
    }
    if (body.byteLength > MAX_PROXY_BODY_BYTES) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    });

    const responseHeaders = new Headers();
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }

    // Preserve backend session refreshes, when supplied. Never log cookie values.
    const upstreamHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = typeof upstreamHeaders.getSetCookie === "function"
      ? upstreamHeaders.getSetCookie()
      : [];
    for (const cookie of cookies) responseHeaders.append("set-cookie", cookie);

    const emptyBodyStatus = [204, 205, 304].includes(upstream.status);
    return new Response(emptyBodyStatus ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    // Avoid returning upstream details or request data to clients.
    return Response.json(
      { error: "The hosted YourThumb backend could not be reached. Try again or visit https://yourthumb.tech." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
