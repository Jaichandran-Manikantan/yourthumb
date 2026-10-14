"use server";

/** TRADE_SECRET: Affiliate account and payout handling are available on the hosted app only. */
export type AffiliateData = {
  affiliate_code: string;
  unpaid_commission_usd: number;
  payout_address: string | null;
};
export type AffiliateDataResult =
  | { success: true; data: AffiliateData }
  | { success: false; error: string };
const unavailable = "The affiliate hub is available on the hosted YourThumb application.";
export async function getAffiliateData(): Promise<AffiliateDataResult> {
  return { success: false, error: unavailable };
}
export async function savePayoutAddress(_payoutAddress: string) {
  throw new Error(unavailable);
}
