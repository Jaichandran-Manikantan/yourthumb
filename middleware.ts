import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  createReferralCookieValue,
  isValidReferralCode,
} from "@/lib/referrals/cookie";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const rawReferralCode = request.nextUrl.searchParams.get("ref");
  const referralCode = rawReferralCode?.trim().toUpperCase() ?? "";

  if (isValidReferralCode(referralCode)) {
    const value = await createReferralCookieValue(referralCode);
    if (value) {
      response.cookies.set({
        name: REFERRAL_COOKIE_NAME,
        value,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
