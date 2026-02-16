import { supabaseAdmin } from "@/lib/supabase";
import { computeStats, getTier } from "@/lib/stats";
import { computeOVR } from "@/lib/stats";
import { insertFeedEvent } from "@/lib/feed";
import { getRaceBonus } from "@/lib/race-points";
import type { StravaActivity, ComputedStats, CardTier, SpecialCardType } from "@/types";

// Decay rate: stats lose 2-5% per inactive week (makes people ride to keep their card)
const DECAY_RATE = 0.03; // 3% decay per inactive week
const MAX_DECAY_WEEKS = 4; // After 4 weeks inactive, decay stops (floor)

// Cron secret to protect the endpoint
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/monday-update
 *
 * Called every Monday at 6:00 UTC by Vercel Cron.
 * 1. Snapshots current stats to history
 * 2. Recalculates stats for all users from cached Strava activities
 * 3. Applies decay for inactive users
 * 4. Computes deltas (new vs previous)
 * 5. Selects L'Échappée de la Semaine (weekly best players)
 * 6. Marks In-Form cards (biggest gainers)
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weekLabel = getWeekLabel();
    const prevWeekLabel = getWeekLabel(-1);

    console.log(`[MONDAY UPDATE] Starting for week ${weekLabel}`);

    // 1. Fetch all users with their current stats
    const { data: allStats, error: statsError } = await supabaseAdmin
      .from("user_stats")
      .select("*, profiles!inner(id, strava_id, username, avatar_url)");

    if (statsError) throw statsError;
    if (!allStats || allStats.length === 0) {
      return Response.json({ message: "No users to update", week: weekLabel });
    }

    console.log(`[MONDAY UPDATE] Processing ${allStats.length} users`);

    let updatedCount = 0;
    let decayedCount = 0;
    const progressions: { user_id: string; delta_ovr: number; username: string; avatar_url: string | null; ovr: number; tier: CardTier }[] = [];

    for (const userStat of allStats) {
      const userId = userStat.user_id;
      const profile = (userStat as any).profiles;

      // 2. Snapshot current stats to history BEFORE recalculating
      await supabaseAdmin.from("stats_history").upsert({
        user_id: userId,
        week_label: prevWeekLabel,
        pac: userStat.pac,
        end: userStat.end,
        mon: userStat.mon,
        res: userStat.res,
        spr: userStat.spr,
        val: userStat.val,
        ovr: userStat.ovr,
        tier: userStat.tier,
        special_card: userStat.special_card,
      }, { onConflict: "user_id,week_label" });

      // 3. Get this week's activities from cached strava_activities
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weekActivities } = await supabaseAdmin
        .from("strava_activities")
        .select("*")
        .eq("user_id", userId)
        .gte("start_date", oneWeekAgo.toISOString())
        .eq("activity_type", "Ride");

      const weeklyKm = (weekActivities || []).reduce((sum, a) => sum + (a.distance / 1000), 0);
      const weeklyDplus = (weekActivities || []).reduce((sum, a) => sum + a.total_elevation_gain, 0);
      const weeklyRides = (weekActivities || []).length;

      // 4. Get ALL cached activities for full recalculation (last 50)
      const { data: allActivities } = await supabaseAdmin
        .from("strava_activities")
        .select("*")
        .eq("user_id", userId)
        .eq("activity_type", "Ride")
        .order("start_date", { ascending: false })
        .limit(50);

      // Save previous stats
      const prevStats = {
        pac: userStat.pac,
        end: userStat.end,
        mon: userStat.mon,
        res: userStat.res,
        spr: userStat.spr,
        val: userStat.val,
        ovr: userStat.ovr,
        tier: userStat.tier,
      };

      let newStats: ComputedStats;
      let newTier: CardTier;
      let isActive = weeklyRides > 0;

      if (allActivities && allActivities.length > 0) {
        // Convert DB rows to StravaActivity format for computeStats
        const stravaFormat: StravaActivity[] = allActivities.map((a) => ({
          id: a.strava_activity_id,
          name: a.name || "",
          distance: a.distance,
          moving_time: a.moving_time,
          elapsed_time: a.elapsed_time || a.moving_time,
          total_elevation_gain: a.total_elevation_gain,
          average_speed: a.average_speed,
          max_speed: a.max_speed || 0,
          weighted_average_watts: a.weighted_average_watts || undefined,
          start_date: a.start_date,
          type: a.activity_type,
        }));

        newStats = computeStats(stravaFormat);
        newTier = getTier(newStats);
      } else {
        // No activities at all — keep current stats
        newStats = { pac: prevStats.pac, end: prevStats.end, mon: prevStats.mon, res: prevStats.res, spr: prevStats.spr, val: prevStats.val, ovr: prevStats.ovr };
        newTier = prevStats.tier as CardTier;
      }

      // 4b. Apply race result bonuses to stats
      const { data: weekRaceResults } = await supabaseAdmin
        .from("race_results")
        .select("position, race_id, races!inner(total_participants, federation, distance_km, elevation_gain, rdi_score)")
        .eq("user_id", userId)
        .gte("created_at", oneWeekAgo.toISOString());

      let totalResBoost = 0;
      let totalOvrBoost = 0;

      if (weekRaceResults && weekRaceResults.length > 0) {
        for (const result of weekRaceResults) {
          const race = (result as any).races;
          const total = race?.total_participants || 1;
          const bonus = getRaceBonus(result.position, total);
          totalResBoost += bonus.resBoost;
          totalOvrBoost += bonus.ovrBoost;
        }

        // Cap bonuses: max +5 RES, +3 OVR per week
        totalResBoost = Math.min(totalResBoost, 5);
        totalOvrBoost = Math.min(totalOvrBoost, 3);

        // Apply RES boost
        newStats.res = Math.min(99, newStats.res + totalResBoost);

        // Recalculate OVR with boosted stats + temporary OVR boost
        newStats.ovr = Math.min(99, computeOVR(newStats) + totalOvrBoost);
        newTier = getTier(newStats);
      }

      // 4c. Check for 3 consecutive podiums → In-Form card
      const { data: recentPodiums } = await supabaseAdmin
        .from("race_results")
        .select("position")
        .eq("user_id", userId)
        .lte("position", 3)
        .order("created_at", { ascending: false })
        .limit(3);

      const hasThreeConsecutivePodiums = recentPodiums && recentPodiums.length >= 3;

      // 5. Apply decay if inactive this week
      if (!isActive) {
        const currentStreak = userStat.active_weeks_streak || 0;
        const weeksInactive = Math.max(0, -currentStreak); // negative streak = inactive weeks

        if (weeksInactive < MAX_DECAY_WEEKS) {
          const decayFactor = 1 - DECAY_RATE;
          newStats = {
            pac: Math.max(1, Math.round(newStats.pac * decayFactor)),
            end: Math.max(1, Math.round(newStats.end * decayFactor)),
            mon: Math.max(1, Math.round(newStats.mon * decayFactor)),
            res: Math.max(1, Math.round(newStats.res * decayFactor)),
            spr: Math.max(1, Math.round(newStats.spr * decayFactor)),
            val: Math.max(1, Math.round(newStats.val * decayFactor)),
            ovr: 0, // recalculated below
          };
          newStats.ovr = computeOVR(newStats);
          newTier = getTier(newStats);
          decayedCount++;
        }
      }

      // 6. Determine special card status
      let specialCard: SpecialCardType | null = null;
      const deltaOvr = newStats.ovr - prevStats.ovr;

      // "In-Form" = gained 5+ OVR in one week OR 3 consecutive podiums
      if (deltaOvr >= 5 || hasThreeConsecutivePodiums) {
        specialCard = "in_form";
      }

      // Update streak
      const newStreak = isActive
        ? Math.max(1, (userStat.active_weeks_streak || 0) + 1)
        : Math.min(-1, (userStat.active_weeks_streak || 0) - 1);

      // 7. Update user_stats with new values + previous for delta display
      await supabaseAdmin
        .from("user_stats")
        .update({
          // New stats
          pac: newStats.pac,
          end: newStats.end,
          mon: newStats.mon,
          res: newStats.res,
          spr: newStats.spr,
          val: newStats.val,
          ovr: newStats.ovr,
          tier: newTier,
          // Previous stats (for delta display)
          prev_pac: prevStats.pac,
          prev_end: prevStats.end,
          prev_mon: prevStats.mon,
          prev_res: prevStats.res,
          prev_spr: prevStats.spr,
          prev_val: prevStats.val,
          prev_ovr: prevStats.ovr,
          prev_tier: prevStats.tier,
          // Meta
          special_card: specialCard,
          active_weeks_streak: newStreak,
          last_synced_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Update weekly stats in history for current week
      await supabaseAdmin.from("stats_history").upsert({
        user_id: userId,
        week_label: weekLabel,
        pac: newStats.pac,
        end: newStats.end,
        mon: newStats.mon,
        res: newStats.res,
        spr: newStats.spr,
        val: newStats.val,
        ovr: newStats.ovr,
        tier: newTier,
        special_card: specialCard,
        weekly_km: Math.round(weeklyKm * 10) / 10,
        weekly_dplus: Math.round(weeklyDplus),
        weekly_rides: weeklyRides,
      }, { onConflict: "user_id,week_label" });

      // Track progressions for L'Échappée
      progressions.push({
        user_id: userId,
        delta_ovr: deltaOvr,
        username: profile.username,
        avatar_url: profile.avatar_url,
        ovr: newStats.ovr,
        tier: newTier,
      });

      // Emit activity feed events
      if (newTier !== prevStats.tier) {
        insertFeedEvent(userId, "tier_up", {
          previousTier: prevStats.tier,
          newTier,
        });
      }

      // Streak milestones: 5, 10, 25 weeks
      if ([5, 10, 25].includes(newStreak)) {
        insertFeedEvent(userId, "streak_milestone", { weeks: newStreak });
      }

      updatedCount++;
    }

    // 8. Select L'Échappée de la Semaine
    await selectEchappee(weekLabel, allStats, progressions);

    console.log(`[MONDAY UPDATE] Done: ${updatedCount} updated, ${decayedCount} decayed`);

    return Response.json({
      success: true,
      week: weekLabel,
      updated: updatedCount,
      decayed: decayedCount,
    });
  } catch (err: any) {
    console.error("[MONDAY UPDATE] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Select L'Échappée de la Semaine — best player in each category
 */
async function selectEchappee(
  weekLabel: string,
  allStats: any[],
  progressions: { user_id: string; delta_ovr: number; username: string; avatar_url: string | null; ovr: number; tier: CardTier }[]
) {
  const categories = ["ovr", "pac", "mon", "spr", "end", "res", "val"] as const;

  for (const cat of categories) {
    const best = allStats.reduce((prev, curr) =>
      (curr[cat] || 0) > (prev[cat] || 0) ? curr : prev
    );

    if (best && best[cat] > 0) {
      await supabaseAdmin.from("team_of_the_week").upsert({
        week_label: weekLabel,
        user_id: best.user_id,
        category: cat,
        stat_value: best[cat],
      }, { onConflict: "week_label,category" });

      // Mark user's card as L'Échappée
      await supabaseAdmin
        .from("user_stats")
        .update({ special_card: "totw" })
        .eq("user_id", best.user_id);

      // Emit feed event for TOTW selection
      insertFeedEvent(best.user_id, "totw_selected", {
        category: cat,
        weekLabel,
      });
    }
  }

  // "Progression" category — biggest OVR gain
  const bestProgression = progressions.reduce((prev, curr) =>
    curr.delta_ovr > prev.delta_ovr ? curr : prev
  );

  if (bestProgression && bestProgression.delta_ovr > 0) {
    await supabaseAdmin.from("team_of_the_week").upsert({
      week_label: weekLabel,
      user_id: bestProgression.user_id,
      category: "progression",
      stat_value: bestProgression.delta_ovr,
    }, { onConflict: "week_label,category" });
  }
}

/**
 * Get ISO week label like "2026-W07"
 */
function getWeekLabel(offsetWeeks = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetWeeks * 7);

  // Get ISO week number
  const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
