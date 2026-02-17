import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { insertFeedEvent } from "@/lib/feed";

/**
 * Get the currently active season.
 */
export async function getActiveSeason() {
  const { data } = await supabaseAdmin
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .single();
  return data;
}

/**
 * Season point values for each activity type.
 */
export const SEASON_POINTS = {
  per_km: 1,
  duel_win: 20,
  quest_complete: 15,
  race_podium: 50,
  race_win: 100,
  war_win: 30,
};

/**
 * Add season points to a user's ranking.
 */
export async function addSeasonPoints(
  userId: string,
  points: number,
  metric: "total_km" | "total_dplus" | "duels_won" | "quests_completed" | "races_podiums" | "wars_won",
  metricValue: number,
): Promise<void> {
  const season = await getActiveSeason();
  if (!season) return;

  const { data: existing } = await supabaseAdmin
    .from("season_rankings")
    .select("season_points, " + metric)
    .eq("season_id", season.id)
    .eq("user_id", userId)
    .single();

  const currentPoints = existing?.season_points || 0;
  const currentMetric = (existing as any)?.[metric] || 0;

  await supabaseAdmin.from("season_rankings").upsert({
    season_id: season.id,
    user_id: userId,
    season_points: currentPoints + points,
    [metric]: currentMetric + metricValue,
    updated_at: new Date().toISOString(),
  }, { onConflict: "season_id,user_id" });
}

/**
 * Finalize a season: compute ranks, distribute rewards.
 */
export async function finalizeSeason(seasonId: string): Promise<void> {
  const { data: rankings } = await supabaseAdmin
    .from("season_rankings")
    .select("user_id, season_points")
    .eq("season_id", seasonId)
    .order("season_points", { ascending: false });

  if (!rankings) return;

  for (let i = 0; i < rankings.length; i++) {
    await supabaseAdmin
      .from("season_rankings")
      .update({ rank: i + 1 })
      .eq("season_id", seasonId)
      .eq("user_id", rankings[i].user_id);

    let coinReward = 0;
    if (i === 0) coinReward = 5000;
    else if (i <= 2) coinReward = 3000;
    else if (i <= 9) coinReward = 1500;
    else if (i <= 49) coinReward = 500;
    else coinReward = 100;

    await addCoins(rankings[i].user_id, coinReward, "season_reward", {
      seasonId,
      rank: i + 1,
    });

    insertFeedEvent(rankings[i].user_id, "season_ended", {
      seasonId,
      rank: i + 1,
      points: rankings[i].season_points,
      coinReward,
    });
  }

  await supabaseAdmin
    .from("seasons")
    .update({ status: "finished" })
    .eq("id", seasonId);
}

/**
 * Get season ranking (top N).
 */
export async function getSeasonRanking(seasonId: string, limit = 50) {
  const { data } = await supabaseAdmin
    .from("season_rankings")
    .select("user_id, season_points, total_km, total_dplus, duels_won, quests_completed, rank, profiles!inner(username, avatar_url)")
    .eq("season_id", seasonId)
    .order("season_points", { ascending: false })
    .limit(limit);

  return (data || []).map((r: any, i: number) => ({
    rank: r.rank || i + 1,
    user_id: r.user_id,
    username: r.profiles?.username || "Cycliste",
    avatar_url: r.profiles?.avatar_url || null,
    season_points: r.season_points,
    total_km: r.total_km,
    duels_won: r.duels_won,
    quests_completed: r.quests_completed,
  }));
}

/**
 * Get a user's season stats.
 */
export async function getUserSeasonStats(userId: string, seasonId: string) {
  const { data } = await supabaseAdmin
    .from("season_rankings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  // Get rank position
  const { count } = await supabaseAdmin
    .from("season_rankings")
    .select("id", { count: "exact", head: true })
    .eq("season_id", seasonId)
    .gt("season_points", data.season_points);

  return {
    ...data,
    rank: (count || 0) + 1,
  };
}
