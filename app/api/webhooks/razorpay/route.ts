// TRADE_SECRET: Webhook verification and payment-fulfillment implementation is private.
// Configure third-party webhooks to target the official hosted application directly.
const disabled = () => Response.json({ error: "Webhook endpoints are not available in the public source package." }, { status: 410 });
export function POST() { return disabled(); }
