import type { Metadata } from "next";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { ReferralAttributionRetry } from "@/components/auth/referral-attribution-retry";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar />
      <ReferralAttributionRetry />
      {children}
    </div>
  );
}
