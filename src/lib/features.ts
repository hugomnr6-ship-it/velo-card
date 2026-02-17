import { isUserPro } from "@/services/subscription.service";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Feature gates — defines what Free vs Pro users can access.
 */
export const FEATURE_LIMITS = {
  free: {
    duels_per_week: 3,
    clubs_max: 1,
    stats_history_weeks: 4,
    special_cards: false,      // TOTW, IF, Legend inaccessibles
    advanced_stats: false,     // FTP, puissance, zones
    card_customization: false, // skins, borders, effets
    global_leaderboard: false, // uniquement régional
    pdf_export: false,
    fantasy_entry: false,      // fantasy cycling fermé
    priority_support: false,
  },
  pro: {
    duels_per_week: Infinity,
    clubs_max: 5,
    stats_history_weeks: 52,
    special_cards: true,
    advanced_stats: true,
    card_customization: true,
    global_leaderboard: true,
    pdf_export: true,
    fantasy_entry: true,
    priority_support: true,
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_LIMITS.free;

/**
 * Check if a user can access a specific feature.
 */
export async function canAccess(userId: string, feature: FeatureKey): Promise<boolean> {
  const isPro = await isUserPro(userId);
  const limits = isPro ? FEATURE_LIMITS.pro : FEATURE_LIMITS.free;
  return !!limits[feature];
}

/**
 * Get the limit value for a feature.
 */
export async function getFeatureLimit(userId: string, feature: FeatureKey) {
  const isPro = await isUserPro(userId);
  const limits = isPro ? FEATURE_LIMITS.pro : FEATURE_LIMITS.free;
  return limits[feature];
}

/**
 * Check duel limit for free users.
 */
export async function canCreateDuel(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const isPro = await isUserPro(userId);
  if (isPro) return { allowed: true, remaining: Infinity };

  // Count duels this week for free users
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from("duels")
    .select("id", { count: "exact", head: true })
    .eq("challenger_id", userId)
    .gte("created_at", weekStart.toISOString());

  const used = count || 0;
  const limit = FEATURE_LIMITS.free.duels_per_week;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}
