import { supabaseAdmin } from "@/lib/supabase";
import { fetchActivities } from "@/lib/strava";
import { computeStats, getTier } from "@/lib/stats";
import { computeBadges } from "@/lib/badges";
import { updateWarProgressForUser } from "@/lib/wars";
import VeloCardClient from "./VeloCardClient";
import RetryButton from "./RetryButton";
import type { StatDeltas, CardTier, SpecialCardType } from "@/types";

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
        .upsert(activityRows, { onConflict: "user_id,strava_activity_id" });
    }

    // 4. Compute stats
    const stats = computeStats(activities);
    const tier = getTier(stats);

    // 5. Fetch previous stats for delta display (from Monday Update)
    const { data: existingStats } = await supabaseAdmin
      .from("user_stats")
      .select("prev_pac, prev_end, prev_mon, prev_res, prev_spr, prev_val, prev_ovr, prev_tier, special_card, active_weeks_streak")
      .eq("user_id", profile.id)
      .single();

    // Compute deltas
    let deltas: StatDeltas | null = null;
    if (existingStats && existingStats.prev_ovr > 0) {
      deltas = {
        pac: stats.pac - (existingStats.prev_pac || 0),
        end: stats.end - (existingStats.prev_end || 0),
        mon: stats.mon - (existingStats.prev_mon || 0),
        res: stats.res - (existingStats.prev_res || 0),
        spr: stats.spr - (existingStats.prev_spr || 0),
        val: stats.val - (existingStats.prev_val || 0),
        ovr: stats.ovr - (existingStats.prev_ovr || 0),
        tierChanged: tier !== (existingStats.prev_tier || tier),
        previousTier: (existingStats.prev_tier || tier) as CardTier,
      };
    }

    const specialCard = existingStats?.special_card as SpecialCardType | null;
    const streak = existingStats?.active_weeks_streak || 0;

    // 6. Upsert user_stats (preserve prev_ fields from Monday Update)
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

    // 7. Update Squad Wars progress (non-blocking, don't break card render)
    updateWarProgressForUser(profile.id).catch(() => {});

    // 8. Compute PlayStyle badges
    const badges = computeBadges(stats);

    // 9. Fetch user's clubs via club_members → clubs
    const { data: memberRows } = await supabaseAdmin
      .from("club_members")
      .select("club_id")
      .eq("user_id", profile.id);

    let clubs: { name: string; logo_url: string }[] = [];
    if (memberRows && memberRows.length > 0) {
      const clubIds = memberRows.map((m: any) => m.club_id);
      const { data: clubRows } = await supabaseAdmin
        .from("clubs")
        .select("name, logo_url")
        .in("id", clubIds);
      clubs = (clubRows || []).filter((c: any) => c.logo_url) as {
        name: string;
        logo_url: string;
      }[];
    }

    // 10. Render the card
    const avatarUrl = userInfo.image || profile.avatar_url || null;

    return (
      <VeloCardClient
        username={userInfo.name}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubs={clubs}
        userId={profile.id}
        deltas={deltas}
        specialCard={specialCard}
        streak={streak}
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
