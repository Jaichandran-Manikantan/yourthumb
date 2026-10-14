export {
  TIER_IDS,
  TIER_PLANS,
  PRICING_PLANS,
  USD_TO_INR_RATE,
  BASE_TIER_IDS,
  addonTierForBase,
  formatTierPrice,
  getAddonPrice,
  getPlanPriceUsd,
  isAddonTier,
  isBaseTier,
  isTierId,
  isTrialTier,
  normalizeTierId,
  orderAmountSubunits,
  type BillingCurrency,
  type PricingPlan,
  type TierId,
  type TierKind,
} from "@/lib/pricing";

import { isBaseTier } from "@/lib/pricing";

export type PackUserState = {
  /** Maps to users.has_claimed_trial */
  trial_used?: boolean | null;
  has_claimed_trial?: boolean | null;
  last_main_pack_purchased_at?: string | null;
  /** Maps to users.active_tier */
  active_pack_type?: string | null;
  active_tier?: string | null;
  tier_expires_at?: string | null;
};

export function trialUsed(user: PackUserState) {
  return Boolean(user.trial_used ?? user.has_claimed_trial);
}

export function activePackType(user: PackUserState) {
  return user.active_pack_type ?? user.active_tier ?? null;
}

export function isMainPackActive(user: PackUserState) {
  const expiresAt = user.tier_expires_at;
  if (!expiresAt) return false;
  if (!isBaseTier(user.active_tier ?? user.active_pack_type)) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export function isNewUser(user: PackUserState) {
  return !trialUsed(user) && !user.last_main_pack_purchased_at;
}

export function isExpiredPackUser(user: PackUserState) {
  return !isNewUser(user) && !isMainPackActive(user);
}

export function mainPackExpiryDate(user: PackUserState) {
  if (!user.tier_expires_at) return null;
  return new Date(user.tier_expires_at);
}

export function daysUntilMainPackExpiry(user: PackUserState) {
  const expiry = mainPackExpiryDate(user);
  if (!expiry) return null;
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000));
}

/** @deprecated Prefer isMainPackActive. */
export function hasActiveBasePack(
  activeTier: string | null | undefined,
  tierExpiresAt: string | null | undefined,
  _lastMainPackPurchasedAt?: string | null
) {
  return isMainPackActive({
    active_tier: activeTier,
    tier_expires_at: tierExpiresAt,
  });
}
