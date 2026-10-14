// TRADE_SECRET: Production-only scheduled-job logic is intentionally omitted.
// Scheduled jobs run on the private hosted backend, not from this public repository.
const disabled = () => Response.json({ error: "This scheduled endpoint is available only on the hosted YourThumb backend." }, { status: 404 });
export function GET() { return disabled(); }
export function POST() { return disabled(); }
