"use client";

import { useState } from "react";
import { Zap, Plus, Check, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/app/actions/user";
import {
  activePackType,
  daysUntilMainPackExpiry,
  isExpiredPackUser,
  isMainPackActive,
  isNewUser,
  mainPackExpiryDate,
} from "@/lib/billing/tiers";
import {
  PRICING_PLANS,
  formatTierPrice,
  getAddonPrice,
  isBaseTier,
  normalizeTierId,
  type BillingCurrency,
  type TierId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const BASE_ORDER: TierId[] = ["starter", "creator", "growth", "pro"];

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

function formatExpiryLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TopUpModal({
  children,
  profile,
}: {
  children: React.JSX.Element;
  profile: UserProfile;
}) {
  const [busyTier, setBusyTier] = useState<TierId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<BillingCurrency>("USD");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const packUser = {
    has_claimed_trial: profile.has_claimed_trial,
    last_main_pack_purchased_at: profile.last_main_pack_purchased_at,
    active_tier: profile.active_tier,
    tier_expires_at: profile.tier_expires_at,
  };

  const mainPackActive = isMainPackActive(packUser);
  const newUser = isNewUser(packUser);
  const expired = isExpiredPackUser(packUser);

  const showTrial = newUser;
  const showMainPacks = newUser || expired;
  const showAddOns = mainPackActive;

  const canonicalActive = normalizeTierId(activePackType(packUser));
  const packName =
    canonicalActive && PRICING_PLANS[canonicalActive]
      ? PRICING_PLANS[canonicalActive].name
      : activePackType(packUser) ?? "main";
  const expiry = mainPackExpiryDate(packUser);
  const daysLeft = daysUntilMainPackExpiry(packUser);
  const addonPriceUsd = getAddonPrice(profile.active_tier);
  const showAddonUpgradeHint =
    showAddOns &&
    (canonicalActive === "starter" || canonicalActive === "creator");

  async function checkPaymentFulfillment(paymentId: string, showPendingMessage = true) {
    setCheckingPayment(true);
    try {
      const statusRes = await fetch(
        `/api/checkout/razorpay/status?paymentId=${encodeURIComponent(paymentId)}`
      );
      const statusData = await statusRes.json().catch(() => ({}));

      if (!statusRes.ok) {
        throw new Error(statusData.error ?? "Could not check payment status");
      }

      if (statusData.fulfillment_status === "FULFILLED") {
        setPendingPaymentId(null);
        window.location.reload();
        return true;
      }

      if (statusData.fulfillment_status === "REFUNDED") {
        setPendingPaymentId(null);
        setError(
          "Payment was captured but could not be fulfilled, so an automatic refund has been initiated."
        );
        return false;
      }

      if (statusData.fulfillment_status === "REFUND_PENDING") {
        setError(
          "Payment was captured, but the automatic refund is still processing. Please do not pay again."
        );
        return false;
      }

      if (statusData.fulfillment_status === "REJECTED") {
        setError(
          statusData.error ??
            "Payment could not be fulfilled automatically. Please contact support."
        );
        return false;
      }

      if (showPendingMessage) {
        setError(
          "Payment was received, but fulfillment is still pending. You can check again below; your credits will be added after reconciliation."
        );
      }
      return false;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not check payment fulfillment status."
      );
      return false;
    } finally {
      setCheckingPayment(false);
    }
  }

  async function handlePurchase(tier: TierId) {
    setError(null);
    setBusyTier(tier);
    try {
      if (currency === "USD") {
        const paypalRes = await fetch("/api/checkout/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const paypalData = await paypalRes.json().catch(() => ({}));
        if (!paypalRes.ok) {
          throw new Error(paypalData.error ?? "Could not create PayPal checkout");
        }
        if (typeof paypalData.approvalUrl !== "string" || !paypalData.approvalUrl.startsWith("https://")) {
          throw new Error("PayPal did not return a valid approval URL");
        }
        window.location.assign(paypalData.approvalUrl);
        return;
      }

      await loadRazorpayScript();

      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, currency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create order");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency,
        name: "YourThumb",
        description: PRICING_PLANS[tier].name,
        order_id: data.orderId,
        prefill: { email: profile.email },
        async handler(response: any) {
          try {
            setBusyTier(tier);
            const verifyRes = await fetch("/api/checkout/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tier,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (verifyRes.status === 202 && verifyData.payment_captured) {
              setError(
                "Payment received. Your credits are being added. This can take a moment."
              );

              const paymentId = response.razorpay_payment_id;
              setPendingPaymentId(paymentId);

              for (let attempt = 0; attempt < 12; attempt++) {
                await new Promise((resolve) => setTimeout(resolve, 2500));
                const fulfilled = await checkPaymentFulfillment(paymentId, false);
                if (fulfilled) return;
              }

              setError(
                "Payment was received, but fulfillment is still pending. You can check again below; your credits will be added after reconciliation."
              );
              return;
            }

            if (!verifyRes.ok) {
              throw new Error(verifyData.error ?? "Fulfillment failed");
            }

            window.location.reload();
          } catch (err) {
            console.error("Payment verification failed:", err);
            setError(
              err instanceof Error
                ? err.message
                : "Payment was received, but credit fulfillment is still pending."
            );
          }
        },
      };

      const checkout = new (window as any).Razorpay(options);
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusyTier(null);
    }
  }

  function PackButton({
    tier,
    highlight,
  }: {
    tier: TierId;
    highlight?: boolean;
  }) {
    const plan = PRICING_PLANS[tier];
    return (
      <button
        type="button"
        onClick={() => handlePurchase(tier)}
        disabled={busyTier !== null}
        className={cn(
          "studio-pack relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff526b] disabled:opacity-60",
          highlight
            ? "studio-pack-active"
            : "border-zinc-200 dark:border-zinc-800"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</span>
            {plan.badge && (
              <Badge className="bg-gradient-to-r from-red-600 to-rose-700 text-[10px] text-white">
                {plan.badge}
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end leading-tight sm:flex-row sm:items-baseline sm:gap-1.5">
            {plan.originalPriceUsd && (
              <span className="text-xs text-zinc-400 line-through">
                {formatTierPrice(plan.originalPriceUsd, currency)}
              </span>
            )}
            <span className="font-bold text-red-600">
              {plan.priceUsd != null
                ? formatTierPrice(plan.priceUsd, currency)
                : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
          {busyTier === tier ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Zap className="size-3.5 fill-yellow-400 text-yellow-500" />
          )}
          <span>
            {plan.generations} generation
            {plan.generations === 1 ? "" : "s"}
            {plan.validityDays ? ` · ${plan.validityDays}-day pack` : ""}
          </span>
        </div>
        <p className="text-xs text-[#90877b]">{plan.description}</p>
      </button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="studio-dialog-content studio-topup max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Top Up Generations</DialogTitle>
          <DialogDescription>
            30-day base packs, a $2 Trial Pack, and 5-generation add-ons.
            PayPal handles global USD checkout; Razorpay handles India INR checkout.
          </DialogDescription>
        </DialogHeader>

        {mainPackActive && expiry && daysLeft !== null && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            Your {packName} pack is active. Next cycle unlocks on{" "}
            {formatExpiryLabel(expiry)} (in {daysLeft}{" "}
            {daysLeft === 1 ? "day" : "days"}).
          </div>
        )}

        {expired && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            Your 30-day pack period has ended. Select a base pack to renew.
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              currency === "USD"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500"
            )}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency("INR")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              currency === "INR"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500"
            )}
          >
            INR
          </button>
        </div>

        {/* Currency label with 50% OFF Badge */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#90877b]">
            {currency === "INR"
              ? "India (INR — UPI supported · Razorpay)"
              : "Global checkout in USD · PayPal"}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 shadow-xs dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-400">
            <Sparkles className="size-3" /> 50% OFF APPLIED
          </span>
        </div>

        <div className="grid gap-3 py-2">
          {showTrial && <PackButton tier="trial" highlight />}

          {showMainPacks && (
            <div className="grid gap-3 sm:grid-cols-2">
              {BASE_ORDER.map((id) => (
                <PackButton key={id} tier={id} highlight={id === "creator"} />
              ))}
            </div>
          )}

          {showAddOns && addonPriceUsd != null && isBaseTier(canonicalActive) && (
            <>
              <button
                type="button"
                onClick={() => handlePurchase("addon_5")}
                disabled={busyTier !== null}
                className="flex flex-col gap-2 rounded-2xl border border-dashed border-red-300 p-4 text-left transition-colors hover:bg-red-50/50 disabled:opacity-60 dark:border-red-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-red-500" />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {PRICING_PLANS.addon_5.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end leading-tight sm:flex-row sm:items-baseline sm:gap-1.5">
                    <span className="text-xs text-zinc-400 line-through">
                      {formatTierPrice(30, currency)}
                    </span>
                    <span className="font-bold text-red-600">
                      {formatTierPrice(addonPriceUsd, currency)}
                    </span>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                  {busyTier === "addon_5" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3 text-red-600" />
                  )}
                  {PRICING_PLANS.addon_5.description}
                </p>
              </button>
              {showAddonUpgradeHint && (
                <p className="text-sm text-[#a59e93]">
                  💡 Upgrade to Growth or Pro to get 5-gen add-ons for only $10.
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            {pendingPaymentId && (
              <button
                type="button"
                onClick={() => checkPaymentFulfillment(pendingPaymentId)}
                disabled={checkingPayment}
                className="text-sm font-medium text-red-600 underline underline-offset-2 disabled:opacity-60"
              >
                {checkingPayment ? "Checking payment…" : "Check payment status again"}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}