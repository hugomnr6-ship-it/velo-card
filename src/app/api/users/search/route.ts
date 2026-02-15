import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/users/search?q=username
 * Search users by username (case-insensitive, partial match).
 * Returns up to 20 results with their stats and tier.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ error: "Minimum 2 caractères" }, { status: 400 });
  }

  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url, region")
      .ilike("username", `%${query}%`)
      .limit(20);

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      return Response.json([]);
    }

    // Get stats for matched users
    const userIds = profiles.map((p) => p.id);
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("user_id, pac, end, mon, res, spr, val, ovr, tier, special_card, active_weeks_streak")
      .in("user_id", userIds);

    const statsMap: Record<string, any> = {};
    for (const s of stats || []) statsMap[s.user_id] = s;

    const results = profiles.map((p) => {
      const st = statsMap[p.id];
      return {
        user_id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        region: p.region || null,
        ovr: st?.ovr || 0,
        tier: st?.tier || "bronze",
        special_card: st?.special_card || null,
      };
    });

    // Sort by OVR descending
    results.sort((a, b) => b.ovr - a.ovr);

    return Response.json(results);
  } catch (err: any) {
    console.error("[USER SEARCH] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
