import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";

const REFERRAL_REWARD_COINS = 500; // coins pour le parrain
const REFERRED_BONUS_COINS = 200;  // coins pour le filleul

/**
 * Generate a unique referral code for a user.
 */
export async function getReferralCode(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (data?.referral_code) return data.referral_code;

  // Generate one
  const code = generateCode();
  await supabaseAdmin
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", userId);

  return code;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VC-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Apply a referral code (called during onboarding).
 */
export async function applyReferralCode(
  newUserId: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  // Find referrer
  const { data: referrer } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("referral_code", code.toUpperCase().trim())
    .single();

  if (!referrer) return { success: false, error: "Code invalide" };
  if (referrer.id === newUserId) return { success: false, error: "Tu ne peux pas te parrainer toi-même" };

  // Check if already referred
  const { data: existing } = await supabaseAdmin
    .from("referrals")
    .select("id")
    .eq("referred_id", newUserId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "Tu as déjà utilisé un code de parrainage" };
  }

  // Create referral
  await supabaseAdmin.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: newUserId,
    referral_code: code.toUpperCase().trim(),
    status: "completed",
  });

  // Update referred user
  await supabaseAdmin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", newUserId);

  // Reward both
  await addCoins(referrer.id, REFERRAL_REWARD_COINS, "badge_earned", {
    source: "referral",
    referredUserId: newUserId,
  }, `referral_reward_${referrer.id}_${newUserId}`);

  await addCoins(newUserId, REFERRED_BONUS_COINS, "badge_earned", {
    source: "referral_bonus",
    referrerId: referrer.id,
  }, `referral_bonus_${newUserId}_${referrer.id}`);

  // Mark as rewarded
  await supabaseAdmin
    .from("referrals")
    .update({ status: "rewarded", reward_given: true })
    .eq("referrer_id", referrer.id)
    .eq("referred_id", newUserId);

  return { success: true };
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string) {
  const [{ count: totalReferrals }, { data: referralCode }] = await Promise.all([
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .eq("status", "rewarded"),
    supabaseAdmin
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .single(),
  ]);

  return {
    code: referralCode?.referral_code || "",
    totalReferrals: totalReferrals || 0,
    totalCoinsEarned: (totalReferrals || 0) * REFERRAL_REWARD_COINS,
  };
}
