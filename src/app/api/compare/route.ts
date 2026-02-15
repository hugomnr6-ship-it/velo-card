import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/compare?user1=xxx&user2=xxx
 * Returns full stats + profile for two users for side-by-side comparison.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return Response.json({ error: "user1 et user2 requis" }, { status: 400 });
  }

  try {
    const [profilesRes, statsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, avatar_url, region, club_name")
        .in("id", [user1, user2]),
      supabaseAdmin
        .from("user_stats")
        .select("user_id, pac, end, mon, res, spr, val, ovr, tier, special_card, active_weeks_streak")
        .in("user_id", [user1, user2]),
    ]);

    const profiles = profilesRes.data || [];
    const stats = statsRes.data || [];

    const profileMap: Record<string, any> = {};
    for (const p of profiles) profileMap[p.id] = p;

    const statsMap: Record<string, any> = {};
    for (const s of stats) statsMap[s.user_id] = s;

    const buildUser = (userId: string) => {
      const p = profileMap[userId];
      const s = statsMap[userId];
      return {
        user_id: userId,
        username: p?.username || "Inconnu",
        avatar_url: p?.avatar_url || null,
        region: p?.region || null,
        club_name: p?.club_name || null,
        pac: s?.pac || 0,
        end: s?.end || 0,
        mon: s?.mon || 0,
        res: s?.res || 0,
        spr: s?.spr || 0,
        val: s?.val || 0,
        ovr: s?.ovr || 0,
        tier: s?.tier || "bronze",
        special_card: s?.special_card || null,
        active_weeks_streak: s?.active_weeks_streak || 0,
      };
    };

    return Response.json({
      user1: buildUser(user1),
      user2: buildUser(user2),
    });
  } catch (err: any) {
    console.error("[COMPARE] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
