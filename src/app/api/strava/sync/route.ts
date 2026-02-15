import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchActivities } from "@/lib/strava";
import { computeStats, getTier } from "@/lib/stats";
import { computeBadges } from "@/lib/badges";
import { updateWarProgressForUser } from "@/lib/wars";

export async function POST() {
  // 1. Check auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // 2. Fetch last 50 activities from Strava
    const activities = await fetchActivities(session.user.accessToken);

    // 3. Get user profile ID from Supabase
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();

    if (!profile) {
      return Response.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // 4. Cache activities in Supabase (upsert to avoid duplicates)
    const activityRows = activities.map((a) => ({
      user_id: profile.id,
      strava_activity_id: a.id,
      name: a.name,
      distance: a.distance,
      moving_time: a.moving_time,
      elapsed_time: a.elapsed_time,
      total_elevation_gain: a.total_elevation_gain,
      average_speed: a.average_speed,
      max_speed: a.max_speed,
      weighted_average_watts: a.weighted_average_watts ?? null,
      start_date: a.start_date,
      activity_type: a.type,
    }));

    if (activityRows.length > 0) {
      await supabaseAdmin
        .from("strava_activities")
        .upsert(activityRows, {
          onConflict: "user_id,strava_activity_id",
        });
    }

    // 5. Compute stats
    const stats = computeStats(activities);
    const tier = getTier(stats);

    // 6. Upsert user_stats
    await supabaseAdmin
      .from("user_stats")
      .upsert(
        {
          user_id: profile.id,
          pac: stats.pac,
          end: stats.end,
          mon: stats.mon,
          res: stats.res,
          spr: stats.spr,
          val: stats.val,
          ovr: stats.ovr,
          tier,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    // 7. Update Squad Wars progress (non-blocking)
    updateWarProgressForUser(profile.id).catch(() => {});

    // 8. Compute badges
    const badges = computeBadges(stats);

    // 9. Return stats to frontend
    return Response.json({
      pac: stats.pac,
      end: stats.end,
      mon: stats.mon,
      res: stats.res,
      spr: stats.spr,
      val: stats.val,
      ovr: stats.ovr,
      stats,
      tier,
      badges,
      activitiesCount: activities.length,
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return Response.json(
      { error: err.message || "Erreur de synchronisation" },
      { status: 500 },
    );
  }
}
