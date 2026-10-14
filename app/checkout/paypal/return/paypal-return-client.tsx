"use client";

import { useEffect, useState } from "react";

export function PayPalReturnClient({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("Confirming your PayPal payment…");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkStatus() {
    setChecking(true);
    try {
      const response = await fetch(`/api/checkout/paypal/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not check payment status");
      if (data.fulfillment_status === "FULFILLED") {
        setMessage("Payment confirmed — your generations have been added. Redirecting…");
        window.location.assign("/dashboard");
        return;
      }
      if (data.fulfillment_status === "REFUNDED") {
        setError("The payment could not be fulfilled, so a refund has been processed. Contact support if you need help.");
        return;
      }
      if (data.fulfillment_status === "REFUND_PENDING" || data.fulfillment_status === "REJECTED") {
        setError("The payment was received, but fulfillment did not complete. An automatic refund is being reconciled; please do not pay again.");
        return;
      }
      setMessage("PayPal approved the payment. Your order is still being reconciled; please check again shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check payment status.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orderId) {
        setError("PayPal did not return an order ID. Check your billing status from the dashboard.");
        return;
      }
      try {
        const response = await fetch("/api/checkout/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (data.fulfillment_status === "FULFILLED" || data.fulfilled === true) {
          setMessage("Payment confirmed — your generations have been added. Redirecting…");
          window.location.assign("/dashboard");
          return;
        }
        if (response.status >= 400 && data.fulfillment_status !== "REFUND_PENDING" && data.fulfillment_status !== "REFUNDED") {
          setError(data.error ?? "Payment could not be confirmed. Check payment status before trying again.");
          return;
        }
        setMessage(data.error ?? "Payment received. Waiting for fulfillment confirmation…");
        for (let attempt = 0; attempt < 8 && !cancelled; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          // Retrying the capture endpoint is safe: PayPal uses the stable order-based
          // PayPal-Request-Id, and our database fulfillment RPC is idempotent.
          const retryCapture = await fetch("/api/checkout/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const retryData = await retryCapture.json().catch(() => ({}));
          if (cancelled) return;
          if (retryData.fulfillment_status === "FULFILLED" || retryData.fulfilled === true) {
            setMessage("Payment confirmed — your generations have been added. Redirecting…");
            window.location.assign("/dashboard");
            return;
          }
          const statusResponse = await fetch(`/api/checkout/paypal/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
          const status = await statusResponse.json().catch(() => ({}));
          if (cancelled) return;
          if (status.fulfillment_status === "FULFILLED") {
            setMessage("Payment confirmed — your generations have been added. Redirecting…");
            window.location.assign("/dashboard");
            return;
          }
          if (status.fulfillment_status === "REFUNDED" || status.fulfillment_status === "REFUND_PENDING" || status.fulfillment_status === "REJECTED") {
            setError(status.fulfillment_status === "REFUNDED"
              ? "The payment could not be fulfilled, so a refund has been processed. Contact support if you need help."
              : "Payment was received, but fulfillment is not complete. An automatic refund is being reconciled; please do not pay again.");
            return;
          }
        }
        await checkStatus();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not confirm your PayPal payment.");
      }
    }
    void run();
    return () => { cancelled = true; };
    // This page processes one immutable order ID per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-7 text-center shadow-xl">
        <h1 className="text-xl font-semibold">YourThumb checkout</h1>
        <p className="mt-3 text-sm text-zinc-300" role="status">{message}</p>
        {error && <p className="mt-4 text-sm text-rose-300" role="alert">{error}</p>}
        {error && <button type="button" onClick={() => void checkStatus()} disabled={checking} className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60">{checking ? "Checking…" : "Check payment status"}</button>}
        <a href="/dashboard" className="mt-5 block text-sm text-zinc-400 underline underline-offset-4">Return to dashboard</a>
      </section>
    </main>
  );
}
