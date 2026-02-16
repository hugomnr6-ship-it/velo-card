import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

function getWeekBounds(): { monday: string; sunday: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    monday: monday.toISOString(),
    sunday: sunday.toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") || "weekly_km";

  if (!region) {
    return Response.json({ error: "Paramètre région requis" }, { status: 400 });
  }

  const { monday, sunday } = getWeekBounds();

  // Get users — if "france" get all profiles, otherwise filter by region
  const isNational = region.toLowerCase() === "france";
  let profileQuery = supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url");

  if (!isNational) {
    profileQuery = profileQuery.eq("region", region);
  }

  const { data: regionProfiles } = await profileQuery;

  if (!regionProfiles || regionProfiles.length === 0) {
    return Response.json([]);
  }

  const userIds = regionProfiles.map((p: any) => p.id);

  // Get weekly activities
  const { data: activities } = await supabaseAdmin
    .from("strava_activities")
    .select("user_id, distance, total_elevation_gain")
    .in("user_id", userIds)
    .eq("activity_type", "Ride")
    .gte("start_date", monday)
    .lte("start_date", sunday);

  // Get stats
  const { data: allStats } = await supabaseAdmin
    .from("user_stats")
    .select('user_id, pac, "end", mon, val, spr, res, ovr, tier')
    .in("user_id", userIds);

  // Aggregate weekly data
  const weeklyMap: Record<string, { km: number; dplus: number }> = {};
  for (const a of activities || []) {
    if (!weeklyMap[a.user_id]) weeklyMap[a.user_id] = { km: 0, dplus: 0 };
    weeklyMap[a.user_id].km += a.distance / 1000;
    weeklyMap[a.user_id].dplus += a.total_elevation_gain;
  }

  const statsMap: Record<string, any> = {};
  for (const s of allStats || []) statsMap[s.user_id] = s;

  // Build entries
  const entries = regionProfiles.map((p: any) => {
    const weekly = weeklyMap[p.id] || { km: 0, dplus: 0 };
    const st = statsMap[p.id] || { pac: 0, end: 0, mon: 0, val: 0, spr: 0, res: 0, ovr: 0, tier: "bronze" };
    return {
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      weekly_km: Math.round(weekly.km * 10) / 10,
      weekly_dplus: Math.round(weekly.dplus),
      card_score: st.ovr || Math.round((st.pac + st.end + st.mon) / 3),
      tier: st.tier,
      pac: st.pac || 0,
      mon: st.mon || 0,
      val: st.val || 0,
      spr: st.spr || 0,
      end: st.end || 0,
      res: st.res || 0,
      ovr: st.ovr || 0,
    };
  });

  // Sort
  const statSorts = ["pac", "mon", "val", "spr", "end", "res", "ovr"];
  if (sort === "weekly_dplus") {
    entries.sort((a: any, b: any) => b.weekly_dplus - a.weekly_dplus);
  } else if (sort === "card_score") {
    entries.sort((a: any, b: any) => b.card_score - a.card_score);
  } else if (statSorts.includes(sort)) {
    entries.sort((a: any, b: any) => (b[sort] || 0) - (a[sort] || 0));
  } else {
    entries.sort((a: any, b: any) => b.weekly_km - a.weekly_km);
  }

  return Response.json(entries.map((e: any, i: number) => ({ rank: i + 1, ...e })));
}
