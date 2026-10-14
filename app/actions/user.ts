"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserProfile = {
  id: string;
  email: string;
  generation_balance: number;
  has_claimed_trial: boolean;
  has_purchased_standard_pack: boolean;
  active_tier: string | null;
  tier_expires_at: string | null;
  last_main_pack_purchased_at: string | null;
  last_generated_image_url: string | null;
};

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, generation_balance, has_claimed_trial, has_purchased_standard_pack, active_tier, tier_expires_at, last_main_pack_purchased_at, last_generated_image_url"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login");
  }

  return data as UserProfile;
}

