import { PayPalReturnClient } from "./paypal-return-client";

export const dynamic = "force-dynamic";

export default async function PayPalReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <PayPalReturnClient orderId={token ?? ""} />;
}
