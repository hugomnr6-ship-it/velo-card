import { supabaseAdmin } from "@/lib/supabase";
import { computeStats, getTier } from "@/lib/stats";
import { computeOVR } from "@/lib/stats";
import { insertFeedEvent } from "@/lib/feed";
import { getRaceBonus } from "@/lib/race-points";
import { addCoins, COIN_REWARDS } from "@/services/coins.service";
import { assignWeeklyQuests } from "@/services/quests.service";
import { addSeasonPoints, SEASON_POINTS } from "@/services/seasons.service";
import { calculateWeeklyScores, finalizeLeague } from "@/services/fantasy.service";
import { invalidateCache } from "@/lib/cache";
import { ECONOMY } from "@/lib/economy";
import { logger } from "@/lib/logger";
import type { StravaActivity, ComputedStats, CardTier, SpecialCardType } from "@/types";

// Decay rate: stats lose 3% per inactive week (makes people ride to keep their card)
const DECAY_RATE = 0.03;
const MAX_DECAY_WEEKS = 4;
const BATCH_SIZE = 500;

/**
 * Get ISO week label like "2026-W07"
 */
function getWeekLabel(offsetWeeks = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetWeeks * 7);

  const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Select L'Échappée de la Semaine — best player in each category
 */
export async function selectEchappee(
  weekLabel: string,
  allStats: any[],
  progressions: { user_id: string; delta_ovr: number; username: string; avatar_url: string | null; ovr: number; tier: CardTier }[]
) {
  const categories = ["ovr", "pac", "mon", "spr", "end", "res", "val"] as const;

  // Batch all TOTW upserts
  const totwRows: any[] = [];
  const totwUserIds: string[] = [];

  for (const cat of categories) {
    const best = allStats.reduce((prev, curr) =>
      (curr[cat] || 0) > (prev[cat] || 0) ? curr : prev
    );

    if (best && best[cat] > 0) {
      totwRows.push({
        week_label: weekLabel,
        user_id: best.user_id,
        category: cat,
        stat_value: best[cat],
      });
      totwUserIds.push(best.user_id);

      // Feed events + coins (fire-and-forget)
      insertFeedEvent(best.user_id, "totw_selected", { category: cat, weekLabel });
      addCoins(best.user_id, COIN_REWARDS.totw_selected!, "totw_selected", { category: cat, weekLabel }).catch(() => {});
    }
  }

  // "Progression" category — biggest OVR gain
  if (progressions.length > 0) {
    const bestProgression = progressions.reduce((prev, curr) =>
      curr.delta_ovr > prev.delta_ovr ? curr : prev
    );
    if (bestProgression && bestProgression.delta_ovr > 0) {
      totwRows.push({
        week_label: weekLabel,
        user_id: bestProgression.user_id,
        category: "progression",
        stat_value: bestProgression.delta_ovr,
      });
    }
  }

  // Batch upsert TOTW
  if (totwRows.length > 0) {
    await supabaseAdmin.from("team_of_the_week").upsert(totwRows, { onConflict: "week_label,category" });
  }

  // Batch update special_card for TOTW winners
  const uniqueTotwUserIds = [...new Set(totwUserIds)];
  for (const uid of uniqueTotwUserIds) {
    await supabaseAdmin.from("user_stats").update({ special_card: "totw" }).eq("user_id", uid);
  }
}

/**
 * runMondayUpdate — BATCH OPTIMIZED version
 *
 * Instead of 7+ queries PER user (N×7), we:
 * 1. Fetch ALL data upfront in bulk (5-6 queries total)
 * 2. Process everything in memory
 * 3. Batch write results back (upsert by batches of 500)
 *
 * With 10K users: ~15 queries instead of ~70,000
 */
export async function runMondayUpdate(): Promise<{
  success: boolean;
  week: string;
  updated: number;
  decayed: number;
}> {
  const timer = logger.time("monday-update");
  const weekLabel = getWeekLabel();
  const prevWeekLabel = getWeekLabel(-1);

  logger.info("Monday Update starting", { weekLabel });

  // ═══ STEP 1: Fetch ALL data upfront (bulk queries) ═══

  // 1a. All users with stats
  const { data: allStats, error: statsError } = await supabaseAdmin
    .from("user_stats")
    .select("*, profiles!inner(id, strava_id, username, avatar_url)");

  if (statsError) throw statsError;
  if (!allStats || allStats.length === 0) {
    return { success: true, week: weekLabel, updated: 0, decayed: 0 };
  }

  logger.info("Users fetched", { count: allStats.length });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1b. ALL weekly activities for ALL users (1 query instead of N)
  const { data: allWeekActivities } = await supabaseAdmin
    .from("strava_activities")
    .select("user_id, distance, total_elevation_gain, average_speed, max_speed, elapsed_time, activity_type")
    .gte("start_date", oneWeekAgo.toISOString())
    .eq("activity_type", "Ride");

  // 1c. ALL activities for full recalculation (last 50 per user — get more and filter in memory)
  const { data: allActivitiesRaw } = await supabaseAdmin
    .from("strava_activities")
    .select("*")
    .eq("activity_type", "Ride")
    .order("start_date", { ascending: false });

  // 1d. ALL race results this week (1 query instead of N)
  const { data: allRaceResults } = await supabaseAdmin
    .from("race_results")
    .select("user_id, position, race_id, races!inner(total_participants)")
    .gte("created_at", oneWeekAgo.toISOString());

  // 1e. ALL active boosts (1 query instead of N)
  const { data: allActiveBoosts } = await supabaseAdmin
    .from("user_inventory")
    .select("user_id, pack_items(*)")
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString());

  // 1f. ALL recent podiums for In-Form check (1 query instead of N)
  const { data: allPodiums } = await supabaseAdmin
    .from("race_results")
    .select("user_id, position, created_at")
    .lte("position", 3)
    .order("created_at", { ascending: false });

  logger.info("Bulk data fetched", {
    weekActivities: allWeekActivities?.length || 0,
    allActivities: allActivitiesRaw?.length || 0,
    raceResults: allRaceResults?.length || 0,
    activeBoosts: allActiveBoosts?.length || 0,
  });

  // ═══ STEP 2: Aggregate data in memory by user ═══

  // Weekly activity aggregates
  const weeklyMap = new Map<string, { km: number; dplus: number; rides: number }>();
  for (const a of allWeekActivities || []) {
    const existing = weeklyMap.get(a.user_id) || { km: 0, dplus: 0, rides: 0 };
    existing.km += (a.distance || 0) / 1000;
    existing.dplus += a.total_elevation_gain || 0;
    existing.rides += 1;
    weeklyMap.set(a.user_id, existing);
  }

  // All activities per user (limit 50 per user)
  const userActivitiesMap = new Map<string, any[]>();
  for (const a of allActivitiesRaw || []) {
    const list = userActivitiesMap.get(a.user_id) || [];
    if (list.length < 50) list.push(a);
    userActivitiesMap.set(a.user_id, list);
  }

  // Race results per user
  const raceMap = new Map<string, { position: number; total: number }[]>();
  for (const r of allRaceResults || []) {
    const list = raceMap.get(r.user_id) || [];
    list.push({ position: r.position, total: (r as any).races?.total_participants || 1 });
    raceMap.set(r.user_id, list);
  }

  // Active boosts per user
  const boostMap = new Map<string, any[]>();
  for (const b of allActiveBoosts || []) {
    const list = boostMap.get(b.user_id) || [];
    list.push(b);
    boostMap.set(b.user_id, list);
  }

  // Podiums per user (count recent)
  const podiumCountMap = new Map<string, number>();
  for (const p of allPodiums || []) {
    podiumCountMap.set(p.user_id, (podiumCountMap.get(p.user_id) || 0) + 1);
  }

  // ═══ STEP 3: Process each user in memory (no DB calls per user) ═══

  let updatedCount = 0;
  let decayedCount = 0;
  const progressions: { user_id: string; delta_ovr: number; username: string; avatar_url: string | null; ovr: number; tier: CardTier }[] = [];

  // Batch arrays for writes
  const snapshotBatch: any[] = [];
  const statsUpdateBatch: any[] = [];
  const historyBatch: any[] = [];
  const coinOps: Promise<any>[] = [];
  const questOps: Promise<any>[] = [];

  for (const userStat of allStats) {
    const userId = userStat.user_id;
    const profile = (userStat as any).profiles;

    // Snapshot previous stats
    snapshotBatch.push({
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
    });

    // Get weekly aggregates from memory
    const weekly = weeklyMap.get(userId) || { km: 0, dplus: 0, rides: 0 };
    const isActive = weekly.rides > 0;

    // Reward coins for km ridden (async, non-blocking)
    if (weekly.km > 0) {
      const kmCoins = Math.round(weekly.km * ECONOMY.COINS_PER_KM);
      coinOps.push(addCoins(userId, kmCoins, "ride_km", { km: weekly.km, week: weekLabel }).catch(() => {}));
      coinOps.push(addSeasonPoints(userId, Math.round(weekly.km * SEASON_POINTS.per_km), "total_km", weekly.km).catch(() => {}));
    }

    // Previous stats
    const prevStats = {
      pac: userStat.pac, end: userStat.end, mon: userStat.mon,
      res: userStat.res, spr: userStat.spr, val: userStat.val,
      ovr: userStat.ovr, tier: userStat.tier,
    };

    let newStats: ComputedStats;
    let newTier: CardTier;

    // Recalculate from all activities
    const userActivities = userActivitiesMap.get(userId);
    if (userActivities && userActivities.length > 0) {
      const stravaFormat: StravaActivity[] = userActivities.map((a: any) => ({
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
      newStats = { pac: prevStats.pac, end: prevStats.end, mon: prevStats.mon, res: prevStats.res, spr: prevStats.spr, val: prevStats.val, ovr: prevStats.ovr };
      newTier = prevStats.tier as CardTier;
    }

    // Apply race bonuses (from memory)
    const userRaces = raceMap.get(userId);
    if (userRaces && userRaces.length > 0) {
      let totalResBoost = 0;
      let totalOvrBoost = 0;
      for (const r of userRaces) {
        const bonus = getRaceBonus(r.position, r.total);
        totalResBoost += bonus.resBoost;
        totalOvrBoost += bonus.ovrBoost;
      }
      totalResBoost = Math.min(totalResBoost, 5);
      totalOvrBoost = Math.min(totalOvrBoost, 3);
      newStats.res = Math.min(99, newStats.res + totalResBoost);
      newStats.ovr = Math.min(99, computeOVR(newStats) + totalOvrBoost);
      newTier = getTier(newStats);
    }

    // Apply active boosts (from memory)
    const userBoosts = boostMap.get(userId);
    if (userBoosts && userBoosts.length > 0) {
      for (const boost of userBoosts) {
        const item = (boost as any).pack_items;
        if (item?.item_type === "stat_boost" && item.effect?.stat && item.effect?.boost) {
          const stat = item.effect.stat as keyof ComputedStats;
          if (stat in newStats && stat !== "ovr") {
            newStats[stat] = Math.min(99, newStats[stat] + item.effect.boost);
          }
        }
      }
      newStats.ovr = computeOVR(newStats);
      newTier = getTier(newStats);
    }

    // In-Form check (from memory)
    const podiumCount = podiumCountMap.get(userId) || 0;
    const hasThreeConsecutivePodiums = podiumCount >= 3;

    // Apply decay if inactive
    if (!isActive) {
      const currentStreak = userStat.active_weeks_streak || 0;
      const weeksInactive = Math.max(0, -currentStreak);
      if (weeksInactive < MAX_DECAY_WEEKS) {
        const decayFactor = 1 - DECAY_RATE;
        newStats = {
          pac: Math.max(1, Math.round(newStats.pac * decayFactor)),
          end: Math.max(1, Math.round(newStats.end * decayFactor)),
          mon: Math.max(1, Math.round(newStats.mon * decayFactor)),
          res: Math.max(1, Math.round(newStats.res * decayFactor)),
          spr: Math.max(1, Math.round(newStats.spr * decayFactor)),
          val: Math.max(1, Math.round(newStats.val * decayFactor)),
          ovr: 0,
        };
        newStats.ovr = computeOVR(newStats);
        newTier = getTier(newStats);
        decayedCount++;
      }
    }

    // Special card status
    let specialCard: SpecialCardType | null = null;
    const deltaOvr = newStats.ovr - prevStats.ovr;
    if (deltaOvr >= 5 || hasThreeConsecutivePodiums) {
      specialCard = "in_form";
    }

    // Streak
    const newStreak = isActive
      ? Math.max(1, (userStat.active_weeks_streak || 0) + 1)
      : Math.min(-1, (userStat.active_weeks_streak || 0) - 1);

    if (newStreak > 0 && newStreak % ECONOMY.STREAK_BONUS_INTERVAL === 0) {
      coinOps.push(addCoins(userId, newStreak * ECONOMY.STREAK_BONUS_MULTIPLIER, "streak_bonus", { weeks: newStreak }).catch(() => {}));
    }

    // Weekly quests (non-blocking)
    questOps.push(assignWeeklyQuests(userId).catch(() => {}));

    // Prepare batch update for user_stats
    statsUpdateBatch.push({
      userId,
      newStats,
      newTier,
      prevStats,
      specialCard,
      newStreak,
    });

    // Prepare batch history
    historyBatch.push({
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
      weekly_km: Math.round(weekly.km * 10) / 10,
      weekly_dplus: Math.round(weekly.dplus),
      weekly_rides: weekly.rides,
    });

    // Track progressions
    progressions.push({
      user_id: userId,
      delta_ovr: deltaOvr,
      username: profile.username,
      avatar_url: profile.avatar_url,
      ovr: newStats.ovr,
      tier: newTier,
    });

    // Feed events
    if (newTier !== prevStats.tier) {
      insertFeedEvent(userId, "tier_up", { previousTier: prevStats.tier, newTier });
    }
    if ([5, 10, 25].includes(newStreak)) {
      insertFeedEvent(userId, "streak_milestone", { weeks: newStreak });
    }

    updatedCount++;
  }

  // ═══ STEP 4: Batch write all results ═══

  // 4a. Batch upsert snapshots (by lots of 500)
  for (let i = 0; i < snapshotBatch.length; i += BATCH_SIZE) {
    const batch = snapshotBatch.slice(i, i + BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("stats_history")
      .upsert(batch, { onConflict: "user_id,week_label" });
    if (error) logger.error("Snapshot batch error", { batch: i, error: error.message });
  }

  logger.info("Snapshots written", { count: snapshotBatch.length });

  // 4b. Batch update user_stats (Supabase doesn't support conditional bulk update,
  // so we use Promise.all with chunks for parallelism)
  for (let i = 0; i < statsUpdateBatch.length; i += BATCH_SIZE) {
    const batch = statsUpdateBatch.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((item) =>
        supabaseAdmin
          .from("user_stats")
          .update({
            pac: item.newStats.pac,
            end: item.newStats.end,
            mon: item.newStats.mon,
            res: item.newStats.res,
            spr: item.newStats.spr,
            val: item.newStats.val,
            ovr: item.newStats.ovr,
            tier: item.newTier,
            prev_pac: item.prevStats.pac,
            prev_end: item.prevStats.end,
            prev_mon: item.prevStats.mon,
            prev_res: item.prevStats.res,
            prev_spr: item.prevStats.spr,
            prev_val: item.prevStats.val,
            prev_ovr: item.prevStats.ovr,
            prev_tier: item.prevStats.tier,
            special_card: item.specialCard,
            active_weeks_streak: item.newStreak,
            last_synced_at: new Date().toISOString(),
          })
          .eq("user_id", item.userId)
      )
    );
    // Small pause between batches to avoid overloading
    if (i + BATCH_SIZE < statsUpdateBatch.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  logger.info("Stats updated", { count: statsUpdateBatch.length });

  // 4c. Batch upsert history
  for (let i = 0; i < historyBatch.length; i += BATCH_SIZE) {
    const batch = historyBatch.slice(i, i + BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("stats_history")
      .upsert(batch, { onConflict: "user_id,week_label" });
    if (error) logger.error("History batch error", { batch: i, error: error.message });
  }

  // 4d. Wait for coin/quest ops to settle
  await Promise.allSettled([...coinOps, ...questOps]);

  // ═══ STEP 5: Post-processing ═══

  // L'Échappée de la Semaine
  await selectEchappee(weekLabel, allStats, progressions);

  // Leaderboard snapshots (batched)
  await saveLeaderboardSnapshots(weekLabel, allStats, historyBatch);

  // Fantasy leagues
  await processFantasyLeagues();

  // ═══ STEP 6: Invalidate caches ═══
  await Promise.all([
    invalidateCache("leaderboard:*"),
    invalidateCache("totw:*"),
    invalidateCache("profile:*"),
    invalidateCache("stats:*"),
    invalidateCache("season:*"),
  ]);

  const duration = timer.end({ usersProcessed: allStats.length, updated: updatedCount, decayed: decayedCount });
  logger.info("Monday Update complete", { weekLabel, updated: updatedCount, decayed: decayedCount, durationMs: duration });

  return {
    success: true,
    week: weekLabel,
    updated: updatedCount,
    decayed: decayedCount,
  };
}

/**
 * Save weekly leaderboard snapshots — BATCH version
 * Uses pre-computed history data instead of individual DB lookups
 */
async function saveLeaderboardSnapshots(
  weekLabel: string,
  allStats: any[],
  historyBatch: any[]
) {
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearLabel = `${now.getFullYear()}`;

  // Build a lookup from historyBatch
  const historyMap = new Map<string, { km: number; dplus: number; rides: number }>();
  for (const h of historyBatch) {
    historyMap.set(h.user_id, {
      km: h.weekly_km || 0,
      dplus: h.weekly_dplus || 0,
      rides: h.weekly_rides || 0,
    });
  }

  // Fetch ALL existing monthly + yearly snapshots in 2 queries (instead of 2N)
  const userIds = allStats.map((s: any) => s.user_id);

  const [monthlyRes, yearlyRes] = await Promise.all([
    supabaseAdmin
      .from("leaderboard_snapshots")
      .select("user_id, total_km, total_dplus, total_rides")
      .eq("period_type", "monthly")
      .eq("period_label", monthLabel)
      .in("user_id", userIds),
    supabaseAdmin
      .from("leaderboard_snapshots")
      .select("user_id, total_km, total_dplus, total_rides")
      .eq("period_type", "yearly")
      .eq("period_label", yearLabel)
      .in("user_id", userIds),
  ]);

  const existingMonthly = new Map<string, any>();
  for (const m of monthlyRes.data || []) existingMonthly.set(m.user_id, m);
  const existingYearly = new Map<string, any>();
  for (const y of yearlyRes.data || []) existingYearly.set(y.user_id, y);

  // Build batch arrays
  const weeklySnapshots: any[] = [];
  const monthlySnapshots: any[] = [];
  const yearlySnapshots: any[] = [];

  for (const userStat of allStats) {
    const userId = userStat.user_id;
    const weekly = historyMap.get(userId) || { km: 0, dplus: 0, rides: 0 };

    weeklySnapshots.push({
      user_id: userId,
      period_type: "weekly",
      period_label: weekLabel,
      total_km: weekly.km,
      total_dplus: weekly.dplus,
      total_rides: weekly.rides,
      ovr_at_period: userStat.ovr,
    });

    const em = existingMonthly.get(userId);
    monthlySnapshots.push({
      user_id: userId,
      period_type: "monthly",
      period_label: monthLabel,
      total_km: (em?.total_km || 0) + weekly.km,
      total_dplus: (em?.total_dplus || 0) + weekly.dplus,
      total_rides: (em?.total_rides || 0) + weekly.rides,
      ovr_at_period: userStat.ovr,
    });

    const ey = existingYearly.get(userId);
    yearlySnapshots.push({
      user_id: userId,
      period_type: "yearly",
      period_label: yearLabel,
      total_km: (ey?.total_km || 0) + weekly.km,
      total_dplus: (ey?.total_dplus || 0) + weekly.dplus,
      total_rides: (ey?.total_rides || 0) + weekly.rides,
      ovr_at_period: userStat.ovr,
    });
  }

  // Batch upsert all 3 types
  for (const snapshots of [weeklySnapshots, monthlySnapshots, yearlySnapshots]) {
    for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
      const batch = snapshots.slice(i, i + BATCH_SIZE);
      await supabaseAdmin.from("leaderboard_snapshots").upsert(batch, {
        onConflict: "user_id,period_type,period_label",
      });
    }
  }
}

/**
 * Process all active Fantasy leagues
 */
async function processFantasyLeagues() {
  const { data: activeLeagues } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, current_week, duration_weeks, end_date")
    .eq("status", "active");

  if (!activeLeagues || activeLeagues.length === 0) return;

  logger.info("Processing fantasy leagues", { count: activeLeagues.length });

  for (const league of activeLeagues) {
    const newWeek = (league.current_week || 0) + 1;

    try {
      await calculateWeeklyScores(league.id, newWeek);
    } catch (err) {
      logger.error("Fantasy scoring error", { leagueId: league.id, error: String(err) });
    }

    // Grant free transfer (batch per league)
    await supabaseAdmin
      .from("fantasy_participants")
      .update({ transfers_remaining: 1 })
      .eq("league_id", league.id);

    if (newWeek >= league.duration_weeks) {
      try {
        await finalizeLeague(league.id);
        logger.info("Fantasy league finalized", { leagueId: league.id, week: newWeek });
      } catch (err) {
        logger.error("Fantasy finalization error", { leagueId: league.id, error: String(err) });
      }
    } else {
      await supabaseAdmin
        .from("fantasy_leagues")
        .update({ current_week: newWeek })
        .eq("id", league.id);
    }
  }
}
