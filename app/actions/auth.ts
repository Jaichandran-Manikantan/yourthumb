"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function sanitizeReferralCode(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-F0-9]{8}$/.test(code) ? code : null;
}

export async function signInWithGoogle(referralCode?: string) {
  const supabase = await createClient();
  const headersList = await headers();

  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || "https";

  const origin = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const callbackUrl = new URL(`${origin}/auth/callback`);
  const safeReferralCode = sanitizeReferralCode(referralCode);

  if (safeReferralCode) {
    callbackUrl.searchParams.set("ref", safeReferralCode);
  }

  console.log("🔐 Initiating Google OAuth with redirect:", callbackUrl.toString());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    console.error("Google sign in error:", error);
    redirect("/login?error=oauth_error");
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=oauth_error");
}
