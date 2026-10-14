// TRADE_SECRET: Canva OAuth callback state/verifier checks are handled on the official host.
// The local clone must not attempt to process provider callbacks on a different origin.
export function GET() {
  return Response.json({ error: "Complete Canva authorization on https://yourthumb.tech." }, { status: 410 });
}
