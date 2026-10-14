const LOCAL_TEST_TOKEN = "local-test";

export function isCronAuthorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret && header === `Bearer ${secret}`) return true;
  if (process.env.NODE_ENV !== "production" && header === `Bearer ${LOCAL_TEST_TOKEN}`) {
    return true;
  }
  return false;
}
