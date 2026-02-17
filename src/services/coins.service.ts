import { supabaseAdmin } from "@/lib/supabase";
import { ECONOMY } from "@/lib/economy";

export type CoinReason =
  | "ride_km"
  | "duel_win"
  | "quest_complete"
  | "war_win"
  | "totw_selected"
  | "badge_earned"
  | "streak_bonus"
  | "pack_open"
  | "tournament_entry"
  | "skin_purchase"
  | "season_reward"
  | "coins_purchase"
  | "referral_reward"
  | "referral_bonus";

export const COIN_REWARDS: Partial<Record<CoinReason, number>> = {
  duel_win: ECONOMY.COINS_DUEL_WIN,
  war_win: ECONOMY.COINS_WAR_WIN,
  totw_selected: ECONOMY.COINS_TOTW_SELECTED,
  badge_earned: ECONOMY.COINS_BADGE_EARNED,
};

/**
 * Add or remove coins from a user's balance.
 * Uses upsert + RPC for atomic updates.
 * Supports optional idempotency key to prevent duplicate transactions.
 * @returns the new balance
 */
export async function addCoins(
  userId: string,
  amount: number,
  reason: CoinReason,
  metadata: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<number> {
  // Idempotency check: skip if this transaction was already processed
  if (idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from("coin_transactions")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already processed — return current balance without modifying
      const { data: current } = await supabaseAdmin
        .from("user_coins")
        .select("balance")
        .eq("user_id", userId)
        .single();
      return current?.balance || 0;
    }
  }

  const { data: current } = await supabaseAdmin
    .from("user_coins")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const currentBalance = current?.balance || 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error("Solde insuffisant");
  }

  // Upsert balance
  await supabaseAdmin.from("user_coins").upsert({
    user_id: userId,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Increment earned or spent
  if (amount > 0) {
    await supabaseAdmin.rpc("increment_coins_earned", {
      p_user_id: userId,
      p_amount: amount,
    });
  } else if (amount < 0) {
    await supabaseAdmin.rpc("increment_coins_spent", {
      p_user_id: userId,
      p_amount: Math.abs(amount),
    });
  }

  // Log transaction (with optional idempotency key)
  await supabaseAdmin.from("coin_transactions").insert({
    user_id: userId,
    amount,
    reason,
    metadata,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  });

  return newBalance;
}

/**
 * Get a user's coin balance.
 */
export async function getBalance(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("user_coins")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return data?.balance || 0;
}

/**
 * Get a user's full coin info (balance + totals).
 */
export async function getCoinInfo(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_coins")
    .select("balance, total_earned, total_spent")
    .eq("user_id", userId)
    .single();

  return {
    balance: data?.balance || 0,
    totalEarned: data?.total_earned || 0,
    totalSpent: data?.total_spent || 0,
  };
}
