import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import { allBadgeDefinitions, badgeMap } from "@/lib/badges";
import type { ComputedStats, CardTier } from "@/types";

interface CheckBadgesContext {
  userId: string;
  stats: ComputedStats;
  tier: CardTier;
  streak: number;
}

/**
 * Check and unlock all applicable achievement badges for a user.
 * Returns the list of newly earned badge IDs.
 * Uses UNIQUE constraint → idempotent (safe to call repeatedly).
 */
export async function checkBadges(ctx: CheckBadgesContext): Promise<string[]> {
  const { userId, stats, tier, streak } = ctx;

  // 1. Get already earned badges
  const { data: existing } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earnedSet = new Set((existing || []).map((b: any) => b.badge_id));

  // 2. Determine which badges should be unlocked now
  const toUnlock: string[] = [];

  // Performance badges — based on stats
  if (stats.end >= 50) toUnlock.push("century_ride");
  if (stats.mon >= 60) toUnlock.push("summit_hunter");
  if (stats.pac >= 70) toUnlock.push("speed_demon");
  if (stats.res >= 60) toUnlock.push("iron_legs");
  if (stats.mon >= 80) toUnlock.push("mountain_goat");

  // Progression badges
  toUnlock.push("first_sync"); // Always earned after first sync
  if (streak >= 4) toUnlock.push("week_streak_4");
  if (streak >= 12) toUnlock.push("week_streak_12");
  if (tier === "diamant" || tier === "legende") toUnlock.push("reached_diamant");

  // tier_up_once — check if tier changed from prev (will be set elsewhere)
  // first_duel, duel_win_5, first_war, club_joined, echappee_once
  // These social badges are checked by their respective API routes

  // Check social badges from DB
  const { data: duelData } = await supabaseAdmin
    .from("duels")
    .select("id, winner_id")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .limit(100);

  if (duelData && duelData.length > 0) {
    toUnlock.push("first_duel");
    const wins = duelData.filter((d: any) => d.winner_id === userId).length;
    if (wins >= 5) toUnlock.push("duel_win_5");
  }

  const { data: warData } = await supabaseAdmin
    .from("war_contributions")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (warData && warData.length > 0) toUnlock.push("first_war");

  const { data: clubData } = await supabaseAdmin
    .from("club_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (clubData && clubData.length > 0) toUnlock.push("club_joined");

  const { data: totwData } = await supabaseAdmin
    .from("team_of_the_week")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (totwData && totwData.length > 0) toUnlock.push("echappee_once");

  // 3. Filter out already earned
  const newBadges = toUnlock.filter(
    (badgeId) => !earnedSet.has(badgeId) && badgeMap.has(badgeId),
  );

  // 4. Insert new badges
  if (newBadges.length > 0) {
    await supabaseAdmin.from("user_badges").upsert(
      newBadges.map((badgeId) => ({
        user_id: userId,
        badge_id: badgeId,
      })),
      { onConflict: "user_id,badge_id" },
    );

    // Emit feed events for each new badge
    for (const badgeId of newBadges) {
      const badge = badgeMap.get(badgeId);
      if (badge) {
        insertFeedEvent(userId, "badge_earned", {
          badgeId,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          rarity: badge.rarity,
        });
      }
    }
  }

  return newBadges;
}
