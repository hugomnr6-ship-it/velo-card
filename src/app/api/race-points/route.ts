import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/race-points?user_id=xxx
 * Returns palmares summary for a user: victories, podiums, total points, race entries.
 * If no user_id, returns for the current user.
 *
 * GET /api/race-points?leaderboard=true&region=xxx
 * Returns top 50 riders by total race points (optionally filtered by region).
 */
export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { searchParams } = new URL(request.url);
  const isLeaderboard = searchParams.get("leaderboard") === "true";

  if (isLeaderboard) {
    return handleLeaderboard(searchParams);
  }

  // Palmares for a specific user
  let userId = searchParams.get("user_id");
  if (!userId) {
    userId = profileId;
  }

  if (!userId) {
    return Response.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  try {
    // Get all race points for this user
    const { data: points } = await supabaseAdmin
      .from("race_points")
      .select("id, race_id, points, position, total_participants, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!points || points.length === 0) {
      return Response.json({
        victories: 0,
        podiums: 0,
        races_completed: 0,
        total_points: 0,
        entries: [],
      });
    }

    // Get race info for each entry
    const raceIds = [...new Set(points.map((p) => p.race_id))];
    const { data: races } = await supabaseAdmin
      .from("races")
      .select("id, name, date, federation")
      .in("id", raceIds);

    const raceMap: Record<string, any> = {};
    for (const r of races || []) raceMap[r.id] = r;

    const victories = points.filter((p) => p.position === 1).length;
    const podiums = points.filter((p) => p.position <= 3).length;
    const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

    const entries = points.map((p) => ({
      race_id: p.race_id,
      race_name: raceMap[p.race_id]?.name || "Course inconnue",
      race_date: raceMap[p.race_id]?.date || p.created_at,
      position: p.position,
      total_participants: p.total_participants,
      points: p.points,
      federation: raceMap[p.race_id]?.federation || "OTHER",
    }));

    return Response.json({
      victories,
      podiums,
      races_completed: points.length,
      total_points: totalPoints,
      entries,
    });
  } catch (err) {
    return handleApiError(err, "RACE_POINTS_GET");
  }
}

async function handleLeaderboard(searchParams: URLSearchParams) {
  const region = searchParams.get("region");

  try {
    // Aggregate race_points by user_id
    const { data: points } = await supabaseAdmin
      .from("race_points")
      .select("user_id, points, position");

    if (!points || points.length === 0) {
      return Response.json([]);
    }

    // Aggregate
    const userStats: Record<string, { total_points: number; victories: number; podiums: number; races: number }> = {};
    for (const p of points) {
      if (!userStats[p.user_id]) {
        userStats[p.user_id] = { total_points: 0, victories: 0, podiums: 0, races: 0 };
      }
      userStats[p.user_id].total_points += p.points;
      userStats[p.user_id].races++;
      if (p.position === 1) userStats[p.user_id].victories++;
      if (p.position <= 3) userStats[p.user_id].podiums++;
    }

    // Get user IDs sorted by total points
    const sortedIds = Object.entries(userStats)
      .sort(([, a], [, b]) => b.total_points - a.total_points)
      .slice(0, 50)
      .map(([id]) => id);

    if (sortedIds.length === 0) return Response.json([]);

    // Fetch profiles
    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url, region")
      .in("id", sortedIds);

    const { data: profiles } = await profileQuery;

    // Fetch tiers
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("user_id, ovr, tier")
      .in("user_id", sortedIds);

    const profileMap: Record<string, any> = {};
    for (const p of profiles || []) profileMap[p.id] = p;

    const statsMap: Record<string, any> = {};
    for (const s of stats || []) statsMap[s.user_id] = s;

    let leaderboard = sortedIds
      .filter((id) => {
        if (!region) return true;
        return profileMap[id]?.region === region;
      })
      .map((id, i) => ({
        rank: i + 1,
        user_id: id,
        username: profileMap[id]?.username || "Inconnu",
        avatar_url: profileMap[id]?.avatar_url || null,
        ovr: statsMap[id]?.ovr || 0,
        tier: statsMap[id]?.tier || "bronze",
        total_points: userStats[id].total_points,
        victories: userStats[id].victories,
        podiums: userStats[id].podiums,
        races: userStats[id].races,
      }));

    // Re-rank after filter
    leaderboard = leaderboard.map((entry, i) => ({ ...entry, rank: i + 1 }));

    return Response.json(leaderboard);
  } catch (err) {
    return handleApiError(err, "RACE_POINTS_GET");
  }
}
