export const AFFILIATE_BOUNTY_USD = 15;
export const TIER_IDS = [
  "trial",
  "starter",
  "creator",
  "growth",
  "pro",
  "addon_5",
] as const;

export type TierId = (typeof TIER_IDS)[number];

export type TierKind = "trial" | "base" | "addon";

export type BillingCurrency = "USD" | "INR";

export const USD_TO_INR_RATE = 96;

export const BASE_TIER_IDS = [
  "starter",
  "creator",
  "growth",
  "pro",
] as const;

export type BaseTierId = (typeof BASE_TIER_IDS)[number];

export type PricingPlan = {
  id: TierId;
  name: string;
  originalPriceUsd?: number;
  priceUsd: number | null;
  generations: number;
  validityDays: number;
  kind: TierKind;
  isTrial?: boolean;
  description: string;
  badge?: string;
};

const LEGACY_TIER_MAP: Record<string, TierId> = {
  TRIPWIRE: "trial",
  STARTER: "starter",
  CREATOR: "creator",
  GROWTH: "growth",
  PRO: "pro",
  ADDON_STARTER: "addon_5",
  ADDON_CREATOR_PRO: "addon_5",
  trial: "trial",
  starter: "starter",
  creator: "creator",
  growth: "growth",
  pro: "pro",
  addon_5: "addon_5",
};

/** Canonical catalog with anchor strikethrough prices */
export const PRICING_PLANS: Record<TierId, PricingPlan> = {
  trial: {
    id: "trial",
    name: "Trial Pack",
    originalPriceUsd: 4,
    priceUsd: 2,
    generations: 1,
    validityDays: 7,
    kind: "trial",
    isTrial: true,
    description: "Try 1 generation",
  },
  starter: {
    id: "starter",
    name: "Starter",
    originalPriceUsd: 40,
    priceUsd: 20,
    generations: 5,
    validityDays: 30,
    kind: "base",
    description: "5 generations · 30-day pack",
  },
  creator: {
    id: "creator",
    name: "Creator",
    originalPriceUsd: 60,
    priceUsd: 30,
    generations: 10,
    validityDays: 30,
    kind: "base",
    description: "10 generations · 30-day pack",
    badge: "Most Popular",
  },
  growth: {
    id: "growth",
    name: "Growth",
    originalPriceUsd: 110,
    priceUsd: 55,
    generations: 20,
    validityDays: 30,
    kind: "base",
    description: "20 generations · 30-day pack",
  },
  pro: {
    id: "pro",
    name: "Pro",
    originalPriceUsd: 120,
    priceUsd: 60,
    generations: 30,
    validityDays: 30,
    kind: "base",
    description: "30 generations · 30-day pack",
    badge: "Best Value",
  },
  addon_5: {
    id: "addon_5",
    name: "5 Generations Add-On",
    originalPriceUsd: 30,
    priceUsd: null,
    generations: 5,
    validityDays: 0,
    kind: "addon",
    description: "+5 generations · keeps current expiry",
  },
};

/** @deprecated Prefer PRICING_PLANS. Kept for existing imports. */
export const TIER_PLANS = Object.fromEntries(
  TIER_IDS.map((id) => {
    const plan = PRICING_PLANS[id];
    return [
      id,
      {
        id: plan.id,
        name: plan.name,
        baseUsd: plan.priceUsd ?? 0,
        generationsAdded: plan.generations,
        validityDays: plan.validityDays,
        kind: plan.kind === "trial" ? "tripwire" : plan.kind,
        description: plan.description,
        badge: plan.badge,
      },
    ];
  })
) as Record<
  TierId,
  {
    id: TierId;
    name: string;
    baseUsd: number;
    generationsAdded: number;
    validityDays: number;
    kind: "tripwire" | "base" | "addon";
    description: string;
    badge?: string;
  }
>;

export function normalizeTierId(value: string | null | undefined): TierId | null {
  if (!value) return null;
  return LEGACY_TIER_MAP[value] ?? LEGACY_TIER_MAP[value.toLowerCase()] ?? null;
}

export function isTierId(value: string): value is TierId {
  return normalizeTierId(value) !== null;
}

export function isBaseTier(tier: string | null | undefined) {
  const id = normalizeTierId(tier);
  return Boolean(id && (BASE_TIER_IDS as readonly string[]).includes(id));
}

export function isAddonTier(tier: string | null | undefined) {
  return normalizeTierId(tier) === "addon_5";
}

export function isTrialTier(tier: string | null | undefined) {
  return normalizeTierId(tier) === "trial";
}

/**
 * Dynamic 5-generation add-on price from the buyer's active base pack.
 * Starter/Creator → $15. Growth/Pro → $10. Otherwise ineligible.
 */
export function getAddonPrice(activeTier: string | null | undefined): number | null {
  const id = normalizeTierId(activeTier);
  if (id === "starter" || id === "creator") return 15;
  if (id === "growth" || id === "pro") return 10;
  return null;
}

export function getPlanPriceUsd(
  tier: string,
  activeTier?: string | null
): number | null {
  const id = normalizeTierId(tier);
  if (!id) return null;
  if (id === "addon_5") return getAddonPrice(activeTier);
  return PRICING_PLANS[id].priceUsd;
}

export function orderAmountSubunits(
  baseUsd: number,
  currency: BillingCurrency
) {
  if (currency === "INR") {
    return Math.round(baseUsd * USD_TO_INR_RATE * 100);
  }
  return Math.round(baseUsd * 100);
}

export function formatTierPrice(
  baseUsd: number,
  currency: BillingCurrency
) {
  if (currency === "INR") {
    return `₹${baseUsd * USD_TO_INR_RATE}`;
  }
  return `$${baseUsd}`;
}

export function addonTierForBase(_activeTier?: string | null): TierId {
  return "addon_5";
}