import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import { allBadgeDefinitions, badgeMap } from "@/lib/badges";
import { addCoins, COIN_REWARDS } from "@/services/coins.service";
import type { ComputedStats, CardTier } from "@/types";

interface CheckBadgesContext {
  userId: string;
  stats: ComputedStats;
  tier: CardTier;
  streak: number;
}

/**
 * Check and unlock all applicable achievement badges for a user.
 * Returns the list of newly earned badge IDs.
 * Uses UNIQUE constraint → idempotent (safe to call repeatedly).
 */
export async function checkBadges(ctx: CheckBadgesContext): Promise<string[]> {
  const { userId, stats, tier, streak } = ctx;

  // 1. Get already earned badges
  const { data: existing } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earnedSet = new Set((existing || []).map((b: any) => b.badge_id));

  // 2. Determine which badges should be unlocked now
  const toUnlock: string[] = [];

  // Performance badges — based on stats
  if (stats.end >= 50) toUnlock.push("century_ride");
  if (stats.mon >= 60) toUnlock.push("summit_hunter");
  if (stats.pac >= 70) toUnlock.push("speed_demon");
  if (stats.res >= 60) toUnlock.push("iron_legs");
  if (stats.mon >= 80) toUnlock.push("mountain_goat");

  // Progression badges
  toUnlock.push("first_sync"); // Always earned after first sync
  if (streak >= 4) toUnlock.push("week_streak_4");
  if (streak >= 12) toUnlock.push("week_streak_12");
  if (tier === "diamant" || tier === "legende") toUnlock.push("reached_diamant");

  // tier_up_once — check if tier changed from prev (will be set elsewhere)
  // first_duel, duel_win_5, first_war, club_joined, echappee_once
  // These social badges are checked by their respective API routes

  // Check social badges from DB
  const { data: duelData } = await supabaseAdmin
    .from("duels")
    .select("id, winner_id")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .limit(100);

  if (duelData && duelData.length > 0) {
    toUnlock.push("first_duel");
    const wins = duelData.filter((d: any) => d.winner_id === userId).length;
    if (wins >= 5) toUnlock.push("duel_win_5");
    if (wins >= 10) toUnlock.push("duel_win_10");
    if (wins >= 25) toUnlock.push("duel_win_25");
  }

  const { data: warData } = await supabaseAdmin
    .from("war_contributions")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (warData && warData.length > 0) toUnlock.push("first_war");

  // War veteran/champion badges
  const { data: warContribAll } = await supabaseAdmin
    .from("war_contributions")
    .select("war_id")
    .eq("user_id", userId);

  if (warContribAll) {
    const uniqueWars = new Set(warContribAll.map((w: any) => w.war_id));
    if (uniqueWars.size >= 5) toUnlock.push("war_veteran_5");

    // War champion: won 3+ wars (check club_wars where user's club won)
    const { data: memberClub } = await supabaseAdmin
      .from("club_members")
      .select("club_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (memberClub) {
      const { count: warsWon } = await supabaseAdmin
        .from("club_wars")
        .select("id", { count: "exact", head: true })
        .eq("winner_club_id", memberClub.club_id)
        .eq("status", "finished");

      if ((warsWon || 0) >= 3) toUnlock.push("war_champion_3");

      // War MVP: highest contributor in a finished war
      const { data: mvpCheck } = await supabaseAdmin
        .from("war_contributions")
        .select("war_id, km_contributed")
        .eq("user_id", userId)
        .order("km_contributed", { ascending: false })
        .limit(1);

      if (mvpCheck && mvpCheck.length > 0) {
        const topContrib = mvpCheck[0];
        const { data: allContribs } = await supabaseAdmin
          .from("war_contributions")
          .select("user_id, km_contributed")
          .eq("war_id", topContrib.war_id)
          .order("km_contributed", { ascending: false })
          .limit(1);

        if (allContribs && allContribs[0]?.user_id === userId) {
          toUnlock.push("war_mvp");
        }
      }
    }
  }

  const { data: clubData } = await supabaseAdmin
    .from("club_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (clubData && clubData.length > 0) toUnlock.push("club_joined");

  const { data: totwData } = await supabaseAdmin
    .from("team_of_the_week")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (totwData && totwData.length > 0) toUnlock.push("echappee_once");

  // Race badges — based on race_results
  const { data: raceResults } = await supabaseAdmin
    .from("race_results")
    .select("position, created_at, race_id, races!inner(distance_km, elevation_gain, rdi_score)")
    .eq("user_id", userId);

  if (raceResults && raceResults.length > 0) {
    const totalRaces = raceResults.length;
    const victories = raceResults.filter((r: any) => r.position === 1);
    const podiums = raceResults.filter((r: any) => r.position <= 3);
    const top10s = raceResults.filter((r: any) => r.position <= 10);

    // Premiere Victoire
    if (victories.length >= 1) toUnlock.push("race_first_win");

    // Podium Machine (3 podiums)
    if (podiums.length >= 3) toUnlock.push("race_podium_3");

    // Decathlonien (10 courses)
    if (totalRaces >= 10) toUnlock.push("race_10_starts");

    // Serial Winner (3 victories — same season check simplified to all-time)
    if (victories.length >= 3) toUnlock.push("race_serial_winner");

    // Iron Man (5 courses in 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRaces = raceResults.filter((r: any) => new Date(r.created_at) >= thirtyDaysAgo);
    if (recentRaces.length >= 5) toUnlock.push("race_iron_man");

    // Roi des Cimes (victory on race with RDI >= 7)
    const mountainWins = victories.filter((r: any) => (r as any).races?.rdi_score >= 7);
    if (mountainWins.length >= 1) toUnlock.push("race_mountain_king");

    // Costaud (finish a race with distance >= 100km)
    const longRaces = raceResults.filter((r: any) => (r as any).races?.distance_km >= 100);
    if (longRaces.length >= 1) toUnlock.push("race_centurion");

    // Grimpeur Confirme (3 top 10 in mountain races — elevation_gain >= 1500)
    const mountainTop10s = top10s.filter((r: any) => (r as any).races?.elevation_gain >= 1500);
    if (mountainTop10s.length >= 3) toUnlock.push("race_climber");
  }

  // Duel streak badge — 5 consecutive wins
  if (duelData && duelData.length > 0) {
    const { data: recentDuels } = await supabaseAdmin
      .from("duels")
      .select("winner_id")
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .eq("status", "resolved")
      .order("resolved_at", { ascending: false })
      .limit(5);

    if (recentDuels && recentDuels.length >= 5) {
      const allWins = recentDuels.every((d: any) => d.winner_id === userId);
      if (allWins) toUnlock.push("duel_streak_5");
    }
  }

  // Pack badges
  const { data: packOpens } = await supabaseAdmin
    .from("pack_opens")
    .select("id, items_received")
    .eq("user_id", userId);

  if (packOpens && packOpens.length > 0) {
    toUnlock.push("first_pack");
    const hasLegendary = packOpens.some((po: any) =>
      (po.items_received || []).some((item: any) => item.rarity === "legendary")
    );
    if (hasLegendary) toUnlock.push("pack_legendary");
  }

  // Season top 10 badge
  const { data: seasonRank } = await supabaseAdmin
    .from("season_rankings")
    .select("rank")
    .eq("user_id", userId)
    .not("rank", "is", null)
    .lte("rank", 10)
    .limit(1);

  if (seasonRank && seasonRank.length > 0) toUnlock.push("season_top10");

  // Tournament winner badge
  const { data: tournamentWins } = await supabaseAdmin
    .from("tournament_participants")
    .select("id")
    .eq("user_id", userId)
    .eq("final_rank", 1)
    .limit(1);

  if (tournamentWins && tournamentWins.length > 0) toUnlock.push("tournament_winner");

  // Quest completion badges
  const { data: completedQuests } = await supabaseAdmin
    .from("user_quests")
    .select("id")
    .eq("user_id", userId)
    .eq("is_completed", true);

  if (completedQuests) {
    if (completedQuests.length >= 10) toUnlock.push("quest_master_10");
    if (completedQuests.length >= 50) toUnlock.push("quest_master_50");
  }

  // Coin badges
  const { data: coinData } = await supabaseAdmin
    .from("user_coins")
    .select("total_earned")
    .eq("user_id", userId)
    .single();

  if (coinData) {
    if (coinData.total_earned >= 1000) toUnlock.push("coins_1000");
    if (coinData.total_earned >= 10000) toUnlock.push("coins_10000");
  }

  // Fantasy badges
  const { data: fantasyParticipations } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, league_id, rank, total_points")
    .eq("user_id", userId);

  if (fantasyParticipations && fantasyParticipations.length > 0) {
    toUnlock.push("fantasy_first_league");

    // fantasy_champion is awarded in finalizeLeague — but also check here
    const fantasyWins = fantasyParticipations.filter((p: any) => p.rank === 1);
    if (fantasyWins.length >= 1) toUnlock.push("fantasy_champion");

    // fantasy_draft_master — has at least one league with 5/5 team
    for (const participation of fantasyParticipations) {
      const { count: teamSize } = await supabaseAdmin
        .from("fantasy_teams")
        .select("id", { count: "exact", head: true })
        .eq("participant_id", participation.id);
      if ((teamSize || 0) >= 5) {
        toUnlock.push("fantasy_draft_master");
        break;
      }
    }

    // fantasy_streak — rank 1 for 3 consecutive weeks in any league
    for (const participation of fantasyParticipations) {
      const { data: weeklyScores } = await supabaseAdmin
        .from("fantasy_weekly_scores")
        .select("week_number, total_score, participant_id")
        .eq("participant_id", participation.id)
        .order("week_number", { ascending: true });

      if (weeklyScores && weeklyScores.length >= 3) {
        let consecutiveFirst = 0;
        for (const ws of weeklyScores) {
          // Check if this was the top score for that week in the league
          const { data: allWeekScores } = await supabaseAdmin
            .from("fantasy_weekly_scores")
            .select("participant_id, total_score")
            .in("participant_id", fantasyParticipations.map((p: any) => p.id).length > 0
              ? (await supabaseAdmin.from("fantasy_participants").select("id").eq("league_id", participation.league_id)).data?.map((p: any) => p.id) || []
              : [])
            .eq("week_number", ws.week_number)
            .order("total_score", { ascending: false })
            .limit(1);

          if (allWeekScores && allWeekScores[0]?.participant_id === participation.id) {
            consecutiveFirst++;
            if (consecutiveFirst >= 3) {
              toUnlock.push("fantasy_streak");
              break;
            }
          } else {
            consecutiveFirst = 0;
          }
        }
        if (toUnlock.includes("fantasy_streak")) break;
      }
    }
  }

  // 3. Filter out already earned
  const newBadges = toUnlock.filter(
    (badgeId) => !earnedSet.has(badgeId) && badgeMap.has(badgeId),
  );

  // 4. Insert new badges
  if (newBadges.length > 0) {
    await supabaseAdmin.from("user_badges").upsert(
      newBadges.map((badgeId) => ({
        user_id: userId,
        badge_id: badgeId,
      })),
      { onConflict: "user_id,badge_id" },
    );

    // Emit feed events + award coins for each new badge
    for (const badgeId of newBadges) {
      const badge = badgeMap.get(badgeId);
      if (badge) {
        insertFeedEvent(userId, "badge_earned", {
          badgeId,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          rarity: badge.rarity,
        });

        // Award coins for earning a badge
        await addCoins(userId, COIN_REWARDS.badge_earned!, "badge_earned", { badgeId });
      }
    }
  }

  return newBadges;
}
