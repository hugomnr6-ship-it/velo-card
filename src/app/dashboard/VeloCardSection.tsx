import { supabaseAdmin } from "@/lib/supabase";
import { fetchActivities } from "@/lib/strava";
import { computeStats, getTier } from "@/lib/stats";
import VeloCardClient from "./VeloCardClient";
import RetryButton from "./RetryButton";

interface UserInfo {
  name: string;
  image: string | null;
  stravaId: number;
  accessToken: string;
}

export default async function VeloCardSection({
  userInfo,
}: {
  userInfo: UserInfo;
}) {
  try {
    // 1. Fetch last 50 activities from Strava API
    const activities = await fetchActivities(userInfo.accessToken);

    // 2. Get profile from Supabase (including avatar_url as fallback)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, avatar_url")
      .eq("strava_id", userInfo.stravaId)
      .single();

    if (!profile) {
      return (
        <p className="text-sm text-red-400">
          Profil introuvable. Reconnecte-toi.
        </p>
      );
    }

    // 3. Cache activities in Supabase (upsert to avoid duplicates)
    const activityRows = activities.map((a) => ({
      user_id: profile.id,
      strava_activity_id: a.id,
      name: a.name,
      distance: a.distance,
      moving_time: a.moving_time,
      total_elevation_gain: a.total_elevation_gain,
      average_speed: a.average_speed,
      start_date: a.start_date,
      activity_type: a.type,
    }));

    if (activityRows.length > 0) {
      await supabaseAdmin
        .from("strava_activities")
        .upsert(activityRows, { onConflict: "user_id,strava_activity_id" });
    }

    // 4. Compute stats
    const stats = computeStats(activities);
    const tier = getTier(stats);

    // 5. Upsert user_stats
    await supabaseAdmin
      .from("user_stats")
      .upsert(
        {
          user_id: profile.id,
          pac: stats.pac,
          end: stats.end,
          grim: stats.grim,
          tier,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    // 6. Render the card (data stays on server, only serializable props sent to client)
    // Use session image, fallback to Supabase avatar_url
    const avatarUrl = userInfo.image || profile.avatar_url || null;

    return (
      <VeloCardClient
        username={userInfo.name}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
      />
    );
  } catch (err: any) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-red-400">
          Erreur de synchronisation : {err.message || "Erreur inconnue"}
        </p>
        <RetryButton />
      </div>
    );
  }
}
