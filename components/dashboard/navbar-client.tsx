"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { YourThumbLogo } from "@/components/brand/logo";
import { TopUpModal } from "./top-up-modal";
import { UserProfileMenu } from "./user-profile-menu";
import type { UserProfile } from "@/app/actions/user";
import { isTrialTier, normalizeTierId, PRICING_PLANS } from "@/lib/pricing";

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function TierBadge({ profile }: { profile: UserProfile }) {
  const remaining = daysLeft(profile.tier_expires_at);
  const isPackExpired =
    profile.tier_expires_at !== null &&
    remaining === 0 &&
    profile.generation_balance > 0;
  const isTrial = isTrialTier(profile.active_tier);
  const canonical = normalizeTierId(profile.active_tier);
  const label = isTrial
    ? "TRIAL"
    : canonical && canonical !== "addon_5"
      ? PRICING_PLANS[canonical].name
      : profile.active_tier ?? (profile.has_purchased_standard_pack ? "Standard" : null);

  if (!label && !isPackExpired) return null;

  return (
    <div className="hidden flex-col items-center leading-none sm:flex">
      {isPackExpired ? (
        <>
          <span className="rounded-full border border-[rgba(255,244,228,.12)] bg-[#1b1815] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#ddd5c9]">
            Frozen
          </span>
          <span className="mt-1 text-[10px] text-[#91877b]">
            until renewal
          </span>
        </>
      ) : (
        <>
          <span className="rounded-full border border-[rgba(255,244,228,.12)] bg-[#1b1815] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#ddd5c9]">
            {label}
          </span>
          {remaining !== null && (
            <span className="mt-1 text-[10px] text-[#91877b]">
              {remaining} {remaining === 1 ? "day" : "days"} left
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function NavbarClient({ profile }: { profile: UserProfile }) {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-[rgba(255,244,228,.065)] bg-[rgba(11,10,9,.90)] px-4 backdrop-blur-xl sm:px-9">
      <Link
        href="/?view=home"
        className="flex items-center gap-2.5 rounded-md pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff526b]"
        aria-label="Home"
      >
        <YourThumbLogo size={32} />
        <span className="text-[20px] font-bold leading-none tracking-[-0.03em] text-[#f3ede4]">
          Home
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[rgba(255,244,228,.11)] bg-[#191714] py-1 pl-3 pr-1">
          <Zap className="size-3.5 fill-yellow-400 text-yellow-500" />
          <span className="text-sm font-medium tabular-nums text-[#f6f1e8]">
            {profile.generation_balance}
          </span>
          <span className="hidden text-sm text-[#a59e93] sm:inline">
            Generations
          </span>
        </div>

        <TopUpModal profile={profile}>
          <button
            type="button"
            className="rounded-[9px] bg-[#f5efe5] px-4 py-2 text-sm font-extrabold text-[#16120f] hover:bg-[#fffaf1] focus:outline-none focus:ring-2 focus:ring-[#ff526b] focus:ring-offset-2 focus:ring-offset-[#0b0a09]"
          >
            Top Up
          </button>
        </TopUpModal>

        <TierBadge profile={profile} />
        <UserProfileMenu email={profile.email} />
      </div>
    </header>
  );
}
