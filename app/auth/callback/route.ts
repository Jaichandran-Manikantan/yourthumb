export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow same-site, path-relative redirects.
function sanitizeNextPath(value: string | null): string {
  const fallback = "/dashboard";
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("@")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}

function canonicalOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNextPath(url.searchParams.get("next"));
  const origin = canonicalOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData.user) {
      // Authentication success is authoritative. Referral attribution is a
      // separate best-effort workflow kicked off after login, so a temporary
      // referral/database failure can never turn a successful OAuth exchange
      // into a false login failure.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
