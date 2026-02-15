import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/users/:userId
 * Returns full public profile data for a user:
 * - Profile info
 * - Current stats + tier
 * - Stats history (last 12 weeks)
 * - Clubs membership
 * - Weekly activity summary
 * - Badges / special card
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    // 1. Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url, region, created_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 2. Stats
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("pac, end, mon, res, spr, val, ovr, tier, special_card, active_weeks_streak, last_synced_at, prev_pac, prev_end, prev_mon, prev_res, prev_spr, prev_val, prev_ovr, prev_tier")
      .eq("user_id", userId)
      .single();

    // 3. Stats history (last 12 weeks)
    const { data: history } = await supabaseAdmin
      .from("stats_history")
      .select("week_label, pac, end, mon, res, spr, val, ovr, tier, special_card, weekly_km, weekly_dplus, weekly_rides")
      .eq("user_id", userId)
      .order("week_label", { ascending: false })
      .limit(12);

    // 4. Clubs
    const { data: clubMemberships } = await supabaseAdmin
      .from("club_members")
      .select("club_id, clubs(id, name, logo_url)")
      .eq("user_id", userId);

    const clubs = (clubMemberships || []).map((cm: any) => ({
      id: cm.clubs.id,
      name: cm.clubs.name,
      logo_url: cm.clubs.logo_url,
    }));

    // 5. Weekly activity (current week)
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const { data: weekActivities } = await supabaseAdmin
      .from("strava_activities")
      .select("distance, total_elevation_gain, moving_time")
      .eq("user_id", userId)
      .eq("activity_type", "Ride")
      .gte("start_date", monday.toISOString());

    const weeklyKm = (weekActivities || []).reduce((sum, a) => sum + a.distance / 1000, 0);
    const weeklyDplus = (weekActivities || []).reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const weeklyRides = (weekActivities || []).length;
    const weeklyTime = (weekActivities || []).reduce((sum, a) => sum + a.moving_time, 0);

    // 6. Total career stats
    const { data: allActivities } = await supabaseAdmin
      .from("strava_activities")
      .select("distance, total_elevation_gain, moving_time")
      .eq("user_id", userId)
      .eq("activity_type", "Ride");

    const totalKm = (allActivities || []).reduce((sum, a) => sum + a.distance / 1000, 0);
    const totalDplus = (allActivities || []).reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const totalRides = (allActivities || []).length;
    const totalTime = (allActivities || []).reduce((sum, a) => sum + a.moving_time, 0);

    // 7. Échappée selections count
    const { count: echappeeCount } = await supabaseAdmin
      .from("team_of_the_week")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 8. War stats
    const { data: warContributions } = await supabaseAdmin
      .from("war_contributions")
      .select("km_contributed, dplus_contributed")
      .eq("user_id", userId);

    const totalWarKm = (warContributions || []).reduce((sum, wc) => sum + (wc.km_contributed || 0), 0);
    const warsParticipated = (warContributions || []).length;

    // Compute deltas if prev stats exist
    const deltas = stats ? {
      pac: stats.pac - (stats.prev_pac || stats.pac),
      end: stats.end - (stats.prev_end || stats.end),
      mon: stats.mon - (stats.prev_mon || stats.mon),
      res: stats.res - (stats.prev_res || stats.res),
      spr: stats.spr - (stats.prev_spr || stats.spr),
      val: stats.val - (stats.prev_val || stats.val),
      ovr: stats.ovr - (stats.prev_ovr || stats.ovr),
    } : null;

    return Response.json({
      profile,
      stats: stats || { pac: 0, end: 0, mon: 0, res: 0, spr: 0, val: 0, ovr: 0, tier: "bronze", special_card: null, active_weeks_streak: 0 },
      deltas,
      history: (history || []).reverse(), // chronological order
      clubs,
      weekly: {
        km: Math.round(weeklyKm * 10) / 10,
        dplus: Math.round(weeklyDplus),
        rides: weeklyRides,
        time: weeklyTime,
      },
      career: {
        totalKm: Math.round(totalKm),
        totalDplus: Math.round(totalDplus),
        totalRides,
        totalTime,
        echappeeSelections: echappeeCount || 0,
        warsParticipated,
        totalWarKm: Math.round(totalWarKm),
      },
    });
  } catch (err: any) {
    console.error("[USER PROFILE] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
