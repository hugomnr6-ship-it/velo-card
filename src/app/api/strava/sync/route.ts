import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import type { AuthProvider } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchActivities } from "@/lib/strava";
import { fetchWahooWorkouts, wahooToActivities } from "@/lib/wahoo";
import { fetchGarminActivities, garminToActivities } from "@/lib/garmin";
import { computeStats, getTier } from "@/lib/stats";
import { computeBadges } from "@/lib/badges";
import { updateWarProgressForUser } from "@/lib/wars";
import { assignDailyQuests, updateQuestProgress } from "@/services/quests.service";
import { invalidateUserCache } from "@/lib/cache";
import { withExternalRetry } from "@/lib/retry";
import type { StravaActivity } from "@/types";

export async function POST(request: Request) {
  // Rate limiting is now handled globally by middleware (Upstash Redis)

  // 1. Check auth
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId, session } = authResult;

  const provider: AuthProvider = session.user.provider || "strava";

  try {
    // 2. Fetch activities from the appropriate provider
    let activities: StravaActivity[];

    // Fetch activities avec retry (exponential backoff pour les APIs externes)
    switch (provider) {
      case "wahoo": {
        const workouts = await withExternalRetry(() => fetchWahooWorkouts(session.user.accessToken));
        activities = wahooToActivities(workouts);
        break;
      }
      case "garmin": {
        const tokenSecret = session.user.oauthTokenSecret || "";
        const garminActivities = await withExternalRetry(() =>
          fetchGarminActivities(session.user.accessToken, tokenSecret)
        );
        activities = garminToActivities(garminActivities);
        break;
      }
      case "strava":
      default: {
        activities = await withExternalRetry(() => fetchActivities(session.user.accessToken));
        break;
      }
    }

    // 4. Cache activities in Supabase (upsert to avoid duplicates)
    // strava_activity_id is used as provider-agnostic external activity ID
    const activityRows = activities.map((a) => ({
      user_id: profileId,
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
          user_id: profileId,
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
    updateWarProgressForUser(profileId).catch(() => {});

    // 7b. Update quest progress (non-blocking)
    assignDailyQuests(profileId).catch(() => {});

    // Compute today's and weekly aggregates for quest progress
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diffToMon);
    weekStart.setHours(0, 0, 0, 0);

    const rides = activities.filter((a) => a.type === "Ride");
    const todayRides = rides.filter((a) => new Date(a.start_date) >= todayStart);
    const weeklyRides = rides.filter((a) => new Date(a.start_date) >= weekStart);

    const todayKm = todayRides.reduce((s, a) => s + a.distance / 1000, 0);
    const todayDplus = todayRides.reduce((s, a) => s + a.total_elevation_gain, 0);
    const wKm = weeklyRides.reduce((s, a) => s + a.distance / 1000, 0);
    const wDplus = weeklyRides.reduce((s, a) => s + a.total_elevation_gain, 0);

    updateQuestProgress(
      profileId, todayKm, todayDplus, todayRides.length,
      wKm, wDplus, weeklyRides.length
    ).catch(() => {});

    // 8. Invalidate user cache after successful sync
    invalidateUserCache(profileId).catch(() => {});

    // 9. Compute badges
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
      provider,
    });
  } catch (err) {
    return handleApiError(err, "STRAVA_SYNC");
  }
}
