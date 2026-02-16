import { supabaseAdmin } from "@/lib/supabase";
import { getRaceBonus } from "@/lib/race-points";
import { insertFeedEvent } from "@/lib/feed";

/**
 * Apply race result bonuses to a user's card stats.
 * - Top 10: +2 RES, +1 OVR
 * - Podium: +3 RES, +2 OVR
 * - Victory: +5 RES, +3 OVR
 *
 * Boosts are added on top of current Strava-based stats.
 * They will naturally decay when the next Strava sync recomputes from scratch,
 * unless the user keeps performing well in races.
 */
export async function applyRaceBonusToStats(
  userId: string,
  position: number,
  totalParticipants: number,
): Promise<void> {
  const bonus = getRaceBonus(position, totalParticipants);
  if (bonus.resBoost === 0 && bonus.ovrBoost === 0) return;

  try {
    // Get current stats
    const { data: currentStats } = await supabaseAdmin
      .from("user_stats")
      .select("res, ovr, tier")
      .eq("user_id", userId)
      .single();

    if (!currentStats) return;

    // Apply boosts (capped at 99)
    const newRes = Math.min(99, currentStats.res + bonus.resBoost);
    const newOvr = Math.min(99, currentStats.ovr + bonus.ovrBoost);

    // Recompute tier based on new OVR
    let newTier = currentStats.tier;
    if (newOvr >= 90) newTier = "legende";
    else if (newOvr >= 80) newTier = "diamant";
    else if (newOvr >= 65) newTier = "platine";
    else if (newOvr >= 50) newTier = "argent";
    else newTier = "bronze";

    await supabaseAdmin
      .from("user_stats")
      .update({ res: newRes, ovr: newOvr, tier: newTier })
      .eq("user_id", userId);

    // Feed event for significant boosts
    if (bonus.resBoost >= 3) {
      insertFeedEvent(userId, "race_stat_boost", {
        res_boost: bonus.resBoost,
        ovr_boost: bonus.ovrBoost,
        new_ovr: newOvr,
        position,
      });
    }
  } catch (err) {
    console.error("[RACE BONUS] Error applying stats boost:", err);
  }
}

/**
 * Evaluate and award race-related achievement badges.
 * Checks the user's full race history and awards badges they've earned.
 */
export async function evaluateRaceBadges(userId: string): Promise<string[]> {
  const newBadges: string[] = [];

  try {
    // Get all race results for this user
    const { data: results } = await supabaseAdmin
      .from("race_results")
      .select("position, race_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!results || results.length === 0) return [];

    const victories = results.filter((r) => r.position === 1).length;
    const podiums = results.filter((r) => r.position <= 3).length;
    const top10s = results.filter((r) => r.position <= 10).length;
    const totalRaces = results.length;

    // Get existing earned badges to avoid duplicates
    const { data: existingBadges } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    const earnedSet = new Set((existingBadges || []).map((b: any) => b.badge_id));

    // Check each race badge condition
    const badgeChecks: { id: string; condition: boolean }[] = [
      { id: "race_first_win", condition: victories >= 1 },
      { id: "race_podium_3", condition: podiums >= 3 },
      { id: "race_10_starts", condition: totalRaces >= 10 },
      { id: "race_serial_winner", condition: victories >= 3 },
    ];

    // Iron Man: 5 races in 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRaces = results.filter(
      (r) => new Date(r.created_at) >= thirtyDaysAgo
    ).length;
    badgeChecks.push({ id: "race_iron_man", condition: recentRaces >= 5 });

    // Mountain King: victory on race with RDI >= 7
    const victoryRaceIds = results
      .filter((r) => r.position === 1)
      .map((r) => r.race_id);

    if (victoryRaceIds.length > 0) {
      const { data: hardRaces } = await supabaseAdmin
        .from("races")
        .select("id, rdi_score")
        .in("id", victoryRaceIds)
        .gte("rdi_score", 7);

      badgeChecks.push({
        id: "race_mountain_king",
        condition: (hardRaces || []).length > 0,
      });
    }

    // Costaud: finished a race with distance >= 100km
    const allRaceIds = [...new Set(results.map((r) => r.race_id))];
    if (allRaceIds.length > 0) {
      const { data: longRaces } = await supabaseAdmin
        .from("races")
        .select("id, distance_km")
        .in("id", allRaceIds)
        .gte("distance_km", 100);

      badgeChecks.push({
        id: "race_centurion",
        condition: (longRaces || []).length > 0,
      });
    }

    // Grimpeur Confirmé: 3 top 10 on mountain races (RDI >= 5)
    const top10RaceIds = results
      .filter((r) => r.position <= 10)
      .map((r) => r.race_id);

    if (top10RaceIds.length > 0) {
      const { data: mountainRaces } = await supabaseAdmin
        .from("races")
        .select("id")
        .in("id", top10RaceIds)
        .gte("rdi_score", 5);

      badgeChecks.push({
        id: "race_climber",
        condition: (mountainRaces || []).length >= 3,
      });
    }

    // Award new badges
    const badgesToInsert: { user_id: string; badge_id: string }[] = [];

    for (const check of badgeChecks) {
      if (check.condition && !earnedSet.has(check.id)) {
        badgesToInsert.push({ user_id: userId, badge_id: check.id });
        newBadges.push(check.id);
      }
    }

    if (badgesToInsert.length > 0) {
      await supabaseAdmin
        .from("user_badges")
        .upsert(badgesToInsert, { onConflict: "user_id,badge_id" });

      // Feed event for each new badge
      for (const badge of newBadges) {
        insertFeedEvent(userId, "badge_earned", { badge_id: badge });
      }
    }
  } catch (err) {
    console.error("[RACE BADGES] Error evaluating badges:", err);
  }

  return newBadges;
}

/**
 * Check if a user qualifies for In-Form special card status.
 * Condition: 3 consecutive podiums (position <= 3) in their most recent races.
 */
export async function checkInFormStatus(userId: string): Promise<boolean> {
  try {
    // Get the user's last 3 race results, most recent first
    const { data: recentResults } = await supabaseAdmin
      .from("race_results")
      .select("position, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!recentResults || recentResults.length < 3) return false;

    // Check if all 3 are podiums
    const isInForm = recentResults.every((r) => r.position <= 3);

    if (isInForm) {
      // Set special_card to "in_form"
      const { data: currentStats } = await supabaseAdmin
        .from("user_stats")
        .select("special_card")
        .eq("user_id", userId)
        .single();

      // Don't downgrade from TOTW or Legende
      if (currentStats?.special_card === "totw" || currentStats?.special_card === "legend") {
        return true; // Already has a higher special card
      }

      await supabaseAdmin
        .from("user_stats")
        .update({ special_card: "in_form" })
        .eq("user_id", userId);

      insertFeedEvent(userId, "special_card_earned", {
        card_type: "in_form",
        reason: "3 podiums consecutifs",
      });

      return true;
    }

    return false;
  } catch (err) {
    console.error("[IN-FORM] Error checking status:", err);
    return false;
  }
}
