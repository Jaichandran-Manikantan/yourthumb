// TRADE_SECRET: The production handler is hosted privately.
// This route preserves the original path and forwards to the official backend.
import { proxyLiveBackend } from "@/lib/backend/live-proxy";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return proxyLiveBackend(request, "/api/checkout/razorpay/status"); }
