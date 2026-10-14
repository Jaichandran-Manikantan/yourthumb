"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, DollarSign, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AFFILIATE_BOUNTY_USD } from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import {
  getAffiliateData,
  savePayoutAddress,
  type AffiliateData,
} from "@/app/actions/affiliate";

export function AffiliateModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCopied(false);

    getAffiliateData()
      .then((result) => {
        if (cancelled) return;

        if (!result.success) {
          setData(null);
          setPayoutAddress("");
          setError(result.error);
          return;
        }

        setData(result.data);
        setPayoutAddress(result.data.payout_address ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setPayoutAddress("");
        setError(err instanceof Error ? err.message : "Failed to load affiliate data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const referralLink =
    typeof window !== "undefined" && data?.affiliate_code
      ? `${window.location.origin}/?ref=${data.affiliate_code}`
      : "";

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setToast("Referral link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await savePayoutAddress(payoutAddress);
        setData((prev) =>
          prev
            ? { ...prev, payout_address: payoutAddress.trim() }
            : prev
        );
        setToast("Payout address saved");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save payout address"
        );
      }
    });
  }

  const balance = Number(data?.unpaid_commission_usd ?? 0).toFixed(2);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="studio-dialog-content studio-affiliate max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Creator Affiliate Hub</DialogTitle>
            <DialogDescription>
              Earn {AFFILIATE_BOUNTY_USD} cash bounty for every creator you refer.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading affiliate hub…
            </div>
          ) : (
            <div className="grid gap-5 py-1">
              <section className="grid gap-2">
                <h3 className="text-sm font-medium">Your referral link</h3>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={referralLink}
                    placeholder="Generating link…"
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!referralLink}
                  >
                    {copied ? (
                      <Check className="mr-1.5 size-4" />
                    ) : (
                      <Copy className="mr-1.5 size-4" />
                    )}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </section>

              <section className="studio-referral-balance rounded-2xl border p-4">
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <DollarSign className="size-4" />
                  Accrued bounty balance
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  ${balance} USD
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Earn a flat {AFFILIATE_BOUNTY_USD.toFixed(2)} USD cash bounty when your referred creator
                  purchases their first standard pack ($20+). The $2 Trial Pack
                  pays $0 bounty.
                </p>
              </section>

              <section className="grid gap-2">
                <h3 className="text-sm font-medium">Payout method</h3>
                <Input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="Enter UPI ID (e.g. name@okhdfcbank) or PayPal email"
                />
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={pending || payoutAddress.trim().length === 0}
                  className="sm:w-auto sm:self-start"
                >
                  {pending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  Save Payout Address
                </Button>
                <p className="text-xs text-muted-foreground">
                  Balances crossing the $50 minimum threshold are settled
                  manually once a month.
                </p>
              </section>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="studio-toast fixed right-4 bottom-4 z-[60] rounded-lg border px-3 py-2 text-sm shadow-md">
          {toast}
        </div>
      )}
    </>
  );
}
