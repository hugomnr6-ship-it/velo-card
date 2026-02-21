import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";

const MAX_BETA_TESTERS = 50;

/**
 * Enroll a user as beta tester (auto-called on first login during beta).
 * Returns { betaNumber, isNew } or null if beta is full.
 */
export async function enrollBetaTester(userId: string): Promise<{
  betaNumber: number;
  isNew: boolean;
} | null> {
  // Check if already enrolled
  const { data: existing } = await supabaseAdmin
    .from("beta_testers")
    .select("beta_number")
    .eq("user_id", userId)
    .single();

  if (existing) {
    return { betaNumber: existing.beta_number, isNew: false };
  }

  // Check if beta is full
  const { count } = await supabaseAdmin
    .from("beta_testers")
    .select("id", { count: "exact", head: true });

  if ((count || 0) >= MAX_BETA_TESTERS) {
    return null; // Beta is full
  }

  // Get next number
  const { data: maxRow } = await supabaseAdmin
    .from("beta_testers")
    .select("beta_number")
    .order("beta_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.beta_number || 0) + 1;

  // Enroll
  const { error } = await supabaseAdmin
    .from("beta_testers")
    .insert({ user_id: userId, beta_number: nextNumber });

  if (error) throw error;

  // Give prototype skin
  await supabaseAdmin.from("user_inventory").insert({
    user_id: userId,
    item_id: "prototype",
    obtained_from: "beta_reward",
    is_active: true,
    equipped: false,
  });

  // Feed event
  insertFeedEvent(userId, "beta_enrolled", {
    betaNumber: nextNumber,
    message: `Beta Testeur #${String(nextNumber).padStart(3, "0")} !`,
  });

  return { betaNumber: nextNumber, isNew: true };
}

/**
 * Get user's beta tester info.
 */
export async function getBetaInfo(userId: string): Promise<{
  betaNumber: number;
  enrolledAt: string;
} | null> {
  const { data } = await supabaseAdmin
    .from("beta_testers")
    .select("beta_number, enrolled_at")
    .eq("user_id", userId)
    .single();

  if (!data) return null;
  return { betaNumber: data.beta_number, enrolledAt: data.enrolled_at };
}

/**
 * Get total beta testers enrolled.
 */
export async function getBetaCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from("beta_testers")
    .select("id", { count: "exact", head: true });

  return count || 0;
}
