// TRADE_SECRET: Canva OAuth is bound to the official production origin.
// Redirect the browser there so OAuth cookies and the provider callback use the same host.
export function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL("/api/auth/canva", "https://yourthumb.tech");
  target.search = incoming.search;
  return Response.redirect(target, 307);
}
