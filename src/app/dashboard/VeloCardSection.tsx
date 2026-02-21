import { supabaseAdmin } from "@/lib/supabase";
import { fetchActivities } from "@/lib/strava";
import { computeStats, getTier } from "@/lib/stats";
import { computeBadges } from "@/lib/badges";
import { checkBadges } from "@/lib/checkBadges";
import { updateWarProgressForUser } from "@/lib/wars";
import { isUserPro } from "@/services/subscription.service";
import { PRO_GATES } from "@/lib/pro-gates";
import { logger } from "@/lib/logger";
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
    // 2. Get profile from Supabase (including avatar_url as fallback)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, avatar_url, country, country_code, equipped_skin")
      .eq("strava_id", userInfo.stravaId)
      .single();

    if (!profile) {
      return (
        <p className="text-sm text-red-400">
          Profil introuvable. Reconnecte-toi.
        </p>
      );
    }

    // Vérifier si le user est Pro pour conditionner le sync Strava
    const isPro = await isUserPro(profile.id);
    const canRefresh = isPro || PRO_GATES.stats.freeCanRefreshStats();

    // 1. Fetch activities from Strava API uniquement si refresh autorisé
    let activities: Awaited<ReturnType<typeof fetchActivities>> = [];
    if (canRefresh) {
      logger.info("[SYNC] Fetching activities", { stravaId: userInfo.stravaId });
      activities = await fetchActivities(userInfo.accessToken);
      logger.info("[SYNC] Fetched activities", { count: activities.length });
    } else {
      logger.debug("[SYNC] Skipping sync — free user, not Monday");
    }

    // 3. Cache activities + fetch previous stats + clubs in PARALLEL
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

    // Parallelize: upsert activities + fetch existing stats + fetch clubs + fetch beta
    const [upsertResult, { data: existingStats }, { data: clubJoinRowsParallel }, { data: betaInfo }] = await Promise.all([
      // Upsert activities (uniquement si on a sync)
      activityRows.length > 0
        ? supabaseAdmin
            .from("strava_activities")
            .upsert(activityRows, { onConflict: "user_id,strava_activity_id" })
        : Promise.resolve(null),
      // Fetch previous stats for delta display + fallback quand pas de sync
      supabaseAdmin
        .from("user_stats")
        .select("pac, end, mon, res, spr, val, ovr, tier, prev_pac, prev_end, prev_mon, prev_res, prev_spr, prev_val, prev_ovr, prev_tier, special_card, active_weeks_streak")
        .eq("user_id", profile.id)
        .single(),
      // Fetch clubs via JOIN (moved from step 9)
      supabaseAdmin
        .from("club_members")
        .select("club:clubs(name, logo_url)")
        .eq("user_id", profile.id),
      // Fetch beta tester info
      supabaseAdmin
        .from("beta_testers")
        .select("beta_number")
        .eq("user_id", profile.id)
        .single(),
    ]);

    // Log si l'upsert des activités a échoué
    if (upsertResult && 'error' in upsertResult && upsertResult.error) {
      logger.error("[SYNC] Erreur upsert strava_activities", { message: upsertResult.error.message, details: upsertResult.error.details });
    } else if (canRefresh) {
      logger.info("[SYNC] Upserted activities", { count: activityRows.length });
    }

    // 4. Compute stats (ou lire depuis la DB si pas de sync)
    let stats: ReturnType<typeof computeStats>;
    let tier: ReturnType<typeof getTier>;

    if (canRefresh && activities.length > 0) {
      // Sync actif : recalculer depuis les activités fraîches
      stats = computeStats(activities);
      tier = getTier(stats);
    } else if (existingStats) {
      // Pas de sync : utiliser les stats du dernier lundi depuis la DB
      stats = {
        pac: existingStats.pac ?? 0,
        mon: existingStats.mon ?? 0,
        val: existingStats.val ?? 0,
        spr: existingStats.spr ?? 0,
        end: existingStats.end ?? 0,
        res: existingStats.res ?? 0,
        ovr: existingStats.ovr ?? 0,
      };
      tier = (existingStats.tier as CardTier) ?? getTier(stats);
    } else {
      // Aucune donnée — fallback vide
      stats = computeStats([]);
      tier = getTier(stats);
    }

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

    // Compute previousTier from prev_tier for Monday Reveal
    const serverPreviousTier = existingStats?.prev_tier
      ? (existingStats.prev_tier as CardTier)
      : null;

    // 6. Upsert user_stats uniquement si on a sync (preserve prev_ fields from Monday Update)
    if (canRefresh) {
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

      // 7b. Check achievement badges (non-blocking)
      checkBadges({
        userId: profile.id,
        stats,
        tier,
        streak,
      }).catch(() => {});
    }

    // 8. Compute PlayStyle badges
    const badges = computeBadges(stats);

    // 9. Build clubs from parallelized fetch (step 3)
    const clubs = (clubJoinRowsParallel || [])
      .map((r: any) => r.club)
      .filter((c: any) => c && c.logo_url) as { name: string; logo_url: string }[];

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
        country={profile.country || undefined}
        countryCode={profile.country_code || undefined}
        userId={profile.id}
        deltas={deltas}
        specialCard={specialCard}
        streak={streak}
        serverPreviousTier={serverPreviousTier}
        skin={profile.equipped_skin || undefined}
        betaNumber={betaInfo?.beta_number || null}
        isPro={isPro}
      />
    );
  } catch (err: any) {
    logger.error("[SYNC] Erreur de synchronisation", { error: err.message || String(err) });
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
