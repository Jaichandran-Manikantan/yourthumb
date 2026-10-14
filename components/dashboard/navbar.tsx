import { getUserProfile } from "@/app/actions/user";
import { NavbarClient } from "./navbar-client";

export async function DashboardNavbar() {
  const profile = await getUserProfile();
  return <NavbarClient profile={profile} />;
}
