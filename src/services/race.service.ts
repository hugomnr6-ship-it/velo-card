import { supabaseAdmin } from "@/lib/supabase";
import { AppError } from "@/lib/api-utils";

export async function getRaceDetail(raceId: string, userId: string) {
  // Fetch race with creator info
  const { data: race, error } = await supabaseAdmin
    .from("races")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .eq("id", raceId)
    .single();

  if (error || !race) {
    throw new AppError("RACE_NOT_FOUND", "Course introuvable", 404);
  }

  // Fetch participants
  const { data: entries } = await supabaseAdmin
    .from("race_entries")
    .select("user_id, joined_at")
    .eq("race_id", raceId)
    .order("joined_at", { ascending: true });

  const userIds = (entries || []).map((e: any) => e.user_id);

  // Fetch profiles and stats for participants in parallel
  let profiles: any[] = [];
  let stats: any[] = [];
  if (userIds.length > 0) {
    const [profilesRes, statsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds),
      supabaseAdmin
        .from("user_stats")
        .select('user_id, pac, "end", mon, ovr, tier')
        .in("user_id", userIds),
    ]);
    profiles = profilesRes.data || [];
    stats = statsRes.data || [];
  }

  const profileMap: Record<string, any> = {};
  for (const p of profiles) profileMap[p.id] = p;

  const statsMap: Record<string, any> = {};
  for (const s of stats) statsMap[s.user_id] = s;

  const participants = (entries || []).map((e: any) => ({
    user_id: e.user_id,
    username: profileMap[e.user_id]?.username || "Inconnu",
    avatar_url: profileMap[e.user_id]?.avatar_url || null,
    pac: statsMap[e.user_id]?.pac || 0,
    end: statsMap[e.user_id]?.end || 0,
    mon: statsMap[e.user_id]?.mon || 0,
    ovr: statsMap[e.user_id]?.ovr || 0,
    tier: statsMap[e.user_id]?.tier || "bronze",
    joined_at: e.joined_at,
  }));

  // Build results if published
  let results: any[] = [];
  const resultsPublished = !!race.results_published;

  if (resultsPublished) {
    const { data: raceResults } = await supabaseAdmin
      .from("race_results")
      .select("position, rider_name, finish_time, gen_score, ghost_id, user_id")
      .eq("race_id", raceId)
      .order("position", { ascending: true });

    if (raceResults && raceResults.length > 0) {
      const resultUserIds = raceResults
        .filter((r: any) => r.user_id)
        .map((r: any) => r.user_id);
      const ghostIds = raceResults
        .filter((r: any) => r.ghost_id)
        .map((r: any) => r.ghost_id);

      const resultProfiles: Record<string, any> = {};
      if (resultUserIds.length > 0) {
        const { data: rp } = await supabaseAdmin
          .from("profiles")
          .select("id, avatar_url")
          .in("id", resultUserIds);
        for (const p of rp || []) resultProfiles[p.id] = p;
      }

      const ghostMap: Record<string, any> = {};
      if (ghostIds.length > 0) {
        const { data: ghosts } = await supabaseAdmin
          .from("ghost_profiles")
          .select("id, claim_token, tier, claimed_by")
          .in("id", ghostIds);
        for (const g of ghosts || []) ghostMap[g.id] = g;
      }

      const resultStats: Record<string, any> = {};
      if (resultUserIds.length > 0) {
        const { data: rs } = await supabaseAdmin
          .from("user_stats")
          .select("user_id, tier")
          .in("user_id", resultUserIds);
        for (const s of rs || []) resultStats[s.user_id] = s;
      }

      results = raceResults.map((r: any) => {
        const isGhost = !!r.ghost_id && !ghostMap[r.ghost_id]?.claimed_by;
        return {
          position: r.position,
          rider_name: r.rider_name,
          finish_time: r.finish_time,
          gen_score: r.gen_score,
          is_ghost: isGhost,
          ghost_claim_token: ghostMap[r.ghost_id]?.claim_token || null,
          avatar_url: r.user_id ? resultProfiles[r.user_id]?.avatar_url || null : null,
          tier: r.ghost_id
            ? ghostMap[r.ghost_id]?.tier || "bronze"
            : resultStats[r.user_id]?.tier || "bronze",
          user_id: r.user_id,
        };
      });
    }
  }

  return {
    ...race,
    participants,
    results,
    results_published: resultsPublished,
    is_creator: userId === race.creator_id,
    is_participant: userIds.includes(userId),
  };
}
