import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { insertFeedEvent } from "@/lib/feed";
import { ECONOMY } from "@/lib/economy";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ——— 1. Create League ———

export async function createLeague(
  userId: string,
  opts: { name: string; isPublic: boolean; entryFee: number; maxParticipants: number; durationWeeks: number },
) {
  let inviteCode = generateInviteCode();

  // Ensure unique invite code
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabaseAdmin
      .from("fantasy_leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
    if (!existing) break;
    inviteCode = generateInviteCode();
  }

  const { data: league, error } = await supabaseAdmin
    .from("fantasy_leagues")
    .insert({
      name: opts.name,
      creator_id: userId,
      invite_code: inviteCode,
      is_public: opts.isPublic,
      entry_fee: opts.entryFee,
      max_participants: opts.maxParticipants,
      duration_weeks: opts.durationWeeks,
      draft_budget: ECONOMY.FANTASY_DRAFT_BUDGET,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Auto-join creator
  await joinLeagueById(userId, league.id);

  insertFeedEvent(userId, "fantasy_league_created", { leagueName: league.name, leagueId: league.id });

  return league;
}

// ——— 2. Join League ———

export async function joinLeague(userId: string, leagueIdOrCode: string) {
  // Try as UUID first, else as invite code
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leagueIdOrCode);

  if (isUUID) {
    return joinLeagueById(userId, leagueIdOrCode);
  }

  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id")
    .eq("invite_code", leagueIdOrCode.toUpperCase())
    .single();

  if (!league) throw new Error("Code d'invitation invalide");
  return joinLeagueById(userId, league.id);
}

async function joinLeagueById(userId: string, leagueId: string) {
  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, status, entry_fee, max_participants, prize_pool")
    .eq("id", leagueId)
    .single();

  if (!league) throw new Error("Ligue introuvable");
  if (league.status !== "draft") throw new Error("Les inscriptions sont closes");

  // Check not already in
  const { data: existing } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .single();

  if (existing) throw new Error("Déjà inscrit");

  // Check not full
  const { count } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId);

  if ((count || 0) >= league.max_participants) throw new Error("Ligue complete");

  // Deduct entry fee with idempotency
  if (league.entry_fee > 0) {
    const idemKey = `fantasy_join_${userId}_${leagueId}`;
    await addCoins(userId, -league.entry_fee, "tournament_entry", { fantasy_league: leagueId }, idemKey);
  }

  // Insert participant
  const { data: participant, error } = await supabaseAdmin
    .from("fantasy_participants")
    .insert({ league_id: leagueId, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;

  // Update prize pool
  await supabaseAdmin
    .from("fantasy_leagues")
    .update({ prize_pool: league.prize_pool + league.entry_fee })
    .eq("id", leagueId);

  return participant;
}

// ——— 3. Start League ———

export async function startLeague(userId: string, leagueId: string) {
  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, creator_id, status, duration_weeks")
    .eq("id", leagueId)
    .single();

  if (!league) throw new Error("Ligue introuvable");
  if (league.creator_id !== userId) throw new Error("Seul le createur peut lancer");
  if (league.status !== "draft") throw new Error("La ligue n'est pas en draft");

  const { count } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId);

  if ((count || 0) < ECONOMY.FANTASY_MIN_PARTICIPANTS) {
    throw new Error(`Minimum ${ECONOMY.FANTASY_MIN_PARTICIPANTS} participants`);
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + league.duration_weeks * 7);

  await supabaseAdmin
    .from("fantasy_leagues")
    .update({
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      current_week: 0,
    })
    .eq("id", leagueId);

  return { started: true };
}

// ——— 4. Get Available Cyclists ———

export async function getAvailableCyclists(leagueId: string) {
  // Get already drafted cyclists in this league
  const { data: participants } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id")
    .eq("league_id", leagueId);

  const participantIds = (participants || []).map((p: any) => p.id);

  let draftedCyclistIds: string[] = [];
  if (participantIds.length > 0) {
    const { data: drafted } = await supabaseAdmin
      .from("fantasy_teams")
      .select("cyclist_id")
      .in("participant_id", participantIds);
    draftedCyclistIds = (drafted || []).map((d: any) => d.cyclist_id);
  }

  // Get all active users with at least 2 weeks of data
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data: users } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, ovr, tier, pac, mon, val, spr, \"end\", res, profiles!inner(id, username, avatar_url)")
    .gte("last_synced_at", twoWeeksAgo.toISOString());

  if (!users) return [];

  return users
    .filter((u: any) => !draftedCyclistIds.includes(u.user_id))
    .map((u: any) => ({
      id: u.user_id,
      username: u.profiles.username,
      avatar_url: u.profiles.avatar_url,
      ovr: u.ovr,
      tier: u.tier,
      pac: u.pac,
      mon: u.mon,
      val: u.val,
      spr: u.spr,
      end: u.end,
      res: u.res,
      cost: u.ovr * ECONOMY.FANTASY_CYCLIST_COST_MULTIPLIER,
    }));
}

// ——— 5. Draft Cyclist ———

export async function draftCyclist(
  participantId: string,
  cyclistId: string,
  isCaptain: boolean,
  isSuperSub: boolean,
) {
  // Get participant + league
  const { data: participant } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, league_id, user_id")
    .eq("id", participantId)
    .single();

  if (!participant) throw new Error("Participant introuvable");

  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, status, draft_budget")
    .eq("id", participant.league_id)
    .single();

  if (!league || league.status !== "draft") throw new Error("Draft non disponible");

  // Check team size
  const { data: team } = await supabaseAdmin
    .from("fantasy_teams")
    .select("id, cyclist_id, is_captain, is_super_sub, draft_cost")
    .eq("participant_id", participantId);

  if ((team || []).length >= ECONOMY.FANTASY_TEAM_SIZE) throw new Error("Equipe complete (5 max)");

  // Check cyclist not already in league
  const { data: allParticipants } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id")
    .eq("league_id", participant.league_id);

  const allPIds = (allParticipants || []).map((p: any) => p.id);
  const { data: existingDraft } = await supabaseAdmin
    .from("fantasy_teams")
    .select("id")
    .in("participant_id", allPIds)
    .eq("cyclist_id", cyclistId)
    .limit(1);

  if (existingDraft && existingDraft.length > 0) throw new Error("Cycliste deja draft dans cette ligue");

  // Get cyclist OVR for cost
  const { data: cyclistStats } = await supabaseAdmin
    .from("user_stats")
    .select("ovr")
    .eq("user_id", cyclistId)
    .single();

  if (!cyclistStats) throw new Error("Cycliste introuvable");

  const cost = cyclistStats.ovr * ECONOMY.FANTASY_CYCLIST_COST_MULTIPLIER;
  const usedBudget = (team || []).reduce((s: number, t: any) => s + t.draft_cost, 0);

  if (usedBudget + cost > league.draft_budget) throw new Error("Budget insuffisant");

  // Check captain/sub uniqueness
  if (isCaptain && (team || []).some((t: any) => t.is_captain)) throw new Error("Un seul capitaine autorise");
  if (isSuperSub && (team || []).some((t: any) => t.is_super_sub)) throw new Error("Un seul super-sub autorise");

  const { data: drafted, error } = await supabaseAdmin
    .from("fantasy_teams")
    .insert({
      participant_id: participantId,
      cyclist_id: cyclistId,
      is_captain: isCaptain,
      is_super_sub: isSuperSub,
      draft_cost: cost,
    })
    .select("*")
    .single();

  if (error) throw error;
  return drafted;
}

// ——— 6. Remove Cyclist ———

export async function removeCyclist(participantId: string, cyclistId: string) {
  const { data: participant } = await supabaseAdmin
    .from("fantasy_participants")
    .select("league_id")
    .eq("id", participantId)
    .single();

  if (!participant) throw new Error("Participant introuvable");

  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("status")
    .eq("id", participant.league_id)
    .single();

  if (!league || league.status !== "draft") throw new Error("Retrait uniquement en phase draft");

  await supabaseAdmin
    .from("fantasy_teams")
    .delete()
    .eq("participant_id", participantId)
    .eq("cyclist_id", cyclistId);

  return { removed: true };
}

// ——— 7. Make Transfer ———

export async function makeTransfer(
  participantId: string,
  droppedCyclistId: string,
  pickedCyclistId: string,
) {
  const { data: participant } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, league_id, user_id, transfers_remaining")
    .eq("id", participantId)
    .single();

  if (!participant) throw new Error("Participant introuvable");

  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, status, current_week")
    .eq("id", participant.league_id)
    .single();

  if (!league || league.status !== "active") throw new Error("Transferts uniquement en phase active");

  // Check picked not already in league
  const { data: allParts } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id")
    .eq("league_id", participant.league_id);

  const allPIds = (allParts || []).map((p: any) => p.id);
  const { data: existingPick } = await supabaseAdmin
    .from("fantasy_teams")
    .select("id")
    .in("participant_id", allPIds)
    .eq("cyclist_id", pickedCyclistId)
    .limit(1);

  if (existingPick && existingPick.length > 0) throw new Error("Cycliste deja dans la ligue");

  // Cost: free if transfers_remaining > 0, else 50 coins
  let transferCost = 0;
  if (participant.transfers_remaining <= 0) {
    transferCost = ECONOMY.FANTASY_EXTRA_TRANSFER_COST;
    await addCoins(participant.user_id, -transferCost, "tournament_entry", { fantasy_transfer: true });
  } else {
    await supabaseAdmin
      .from("fantasy_participants")
      .update({ transfers_remaining: participant.transfers_remaining - 1 })
      .eq("id", participantId);
  }

  // Get picked cyclist cost
  const { data: pickedStats } = await supabaseAdmin
    .from("user_stats")
    .select("ovr")
    .eq("user_id", pickedCyclistId)
    .single();

  if (!pickedStats) throw new Error("Cycliste introuvable");

  // Get dropped team entry to preserve captain/sub status
  const { data: droppedEntry } = await supabaseAdmin
    .from("fantasy_teams")
    .select("is_captain, is_super_sub")
    .eq("participant_id", participantId)
    .eq("cyclist_id", droppedCyclistId)
    .single();

  // Remove dropped
  await supabaseAdmin
    .from("fantasy_teams")
    .delete()
    .eq("participant_id", participantId)
    .eq("cyclist_id", droppedCyclistId);

  // Add picked
  await supabaseAdmin
    .from("fantasy_teams")
    .insert({
      participant_id: participantId,
      cyclist_id: pickedCyclistId,
      is_captain: droppedEntry?.is_captain || false,
      is_super_sub: droppedEntry?.is_super_sub || false,
      draft_cost: pickedStats.ovr * ECONOMY.FANTASY_CYCLIST_COST_MULTIPLIER,
    });

  // Log transfer
  await supabaseAdmin.from("fantasy_transfers").insert({
    participant_id: participantId,
    dropped_cyclist_id: droppedCyclistId,
    picked_cyclist_id: pickedCyclistId,
    week_number: league.current_week,
    cost: transferCost,
  });

  // Feed event
  const { data: pickedProfile } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", pickedCyclistId)
    .single();

  insertFeedEvent(participant.user_id, "fantasy_transfer", {
    cyclistName: pickedProfile?.username || "Cycliste",
    leagueId: league.id,
  });

  return { transferred: true };
}

// ——— 8. Calculate Weekly Scores ———

export async function calculateWeeklyScores(leagueId: string, weekNumber: number) {
  const { data: participants } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, user_id")
    .eq("league_id", leagueId);

  if (!participants || participants.length === 0) return;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const participant of participants) {
    const { data: team } = await supabaseAdmin
      .from("fantasy_teams")
      .select("cyclist_id, is_captain, is_super_sub")
      .eq("participant_id", participant.id);

    if (!team || team.length === 0) continue;

    const breakdown: Record<string, any> = {};
    let totalScore = 0;
    let superSubEntry: any = null;
    let worstRegularScore = Infinity;
    let worstRegularCyclistId: string | null = null;

    for (const member of team) {
      // Get cyclist weekly stats
      const { data: stats } = await supabaseAdmin
        .from("stats_history")
        .select("weekly_km, weekly_dplus, ovr, tier")
        .eq("user_id", member.cyclist_id)
        .order("week_label", { ascending: false })
        .limit(2);

      const currentWeek = stats?.[0];
      const prevWeek = stats?.[1];

      const km = currentWeek?.weekly_km || 0;
      const dplus = currentWeek?.weekly_dplus || 0;
      const ovrChange = currentWeek && prevWeek ? currentWeek.ovr - prevWeek.ovr : 0;
      const tierUp = currentWeek && prevWeek ? currentWeek.tier !== prevWeek.tier && currentWeek.ovr > prevWeek.ovr : false;

      // Check duels won this week
      const { count: duelsWon } = await supabaseAdmin
        .from("duels")
        .select("id", { count: "exact", head: true })
        .eq("winner_id", member.cyclist_id)
        .gte("resolved_at", oneWeekAgo.toISOString());

      // Check TOTW
      const { data: totwCheck } = await supabaseAdmin
        .from("team_of_the_week")
        .select("id")
        .eq("user_id", member.cyclist_id)
        .order("week_label", { ascending: false })
        .limit(1);

      const isTotw = !!(totwCheck && totwCheck.length > 0);

      // Calculate points
      let basePoints = 0;
      basePoints += Math.floor(km / 10) * ECONOMY.FANTASY_POINTS_PER_10KM;
      basePoints += Math.floor(dplus / 100) * ECONOMY.FANTASY_POINTS_PER_100M_ELEV;
      if (ovrChange > 0) basePoints += ECONOMY.FANTASY_POINTS_OVR_UP;
      if (tierUp) basePoints += ECONOMY.FANTASY_POINTS_TIER_UP;
      basePoints += (duelsWon || 0) * ECONOMY.FANTASY_POINTS_DUEL_WIN;
      if (isTotw) basePoints += ECONOMY.FANTASY_POINTS_TOTW;

      const isCaptain = member.is_captain;
      const finalPoints = isCaptain ? basePoints * ECONOMY.FANTASY_CAPTAIN_MULTIPLIER : basePoints;

      const { data: cyclistProfile } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .eq("id", member.cyclist_id)
        .single();

      const entry = {
        name: cyclistProfile?.username || "Cycliste",
        base_points: basePoints,
        captain_bonus: isCaptain,
        super_sub_used: false,
        details: {
          km,
          elevation: dplus,
          ovr_change: ovrChange,
          tier_up: tierUp,
          duels_won: duelsWon || 0,
          totw: isTotw,
        },
      };

      if (member.is_super_sub) {
        superSubEntry = { ...entry, cyclistId: member.cyclist_id, finalPoints };
      } else {
        breakdown[member.cyclist_id] = entry;
        totalScore += finalPoints;

        if (finalPoints < worstRegularScore) {
          worstRegularScore = finalPoints;
          worstRegularCyclistId = member.cyclist_id;
        }
      }
    }

    // Super-sub logic: replace worst regular if sub scores higher
    if (superSubEntry && worstRegularCyclistId && superSubEntry.finalPoints > worstRegularScore) {
      totalScore = totalScore - worstRegularScore + superSubEntry.finalPoints;
      superSubEntry.super_sub_used = true;
      breakdown[superSubEntry.cyclistId] = superSubEntry;
    } else if (superSubEntry) {
      breakdown[superSubEntry.cyclistId] = superSubEntry;
    }

    // Save weekly score
    await supabaseAdmin.from("fantasy_weekly_scores").upsert({
      participant_id: participant.id,
      week_number: weekNumber,
      total_score: totalScore,
      breakdown,
    }, { onConflict: "participant_id,week_number" });

    // Update cumulative
    await supabaseAdmin
      .from("fantasy_participants")
      .update({ weekly_points: totalScore, total_points: participant.user_id ? undefined : 0 })
      .eq("id", participant.id);

    // Sum all weekly scores for total
    const { data: allScores } = await supabaseAdmin
      .from("fantasy_weekly_scores")
      .select("total_score")
      .eq("participant_id", participant.id);

    const cumulTotal = (allScores || []).reduce((s: number, sc: any) => s + sc.total_score, 0);
    await supabaseAdmin
      .from("fantasy_participants")
      .update({ total_points: cumulTotal, weekly_points: totalScore })
      .eq("id", participant.id);
  }

  // Update ranks
  const { data: ranked } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, total_points")
    .eq("league_id", leagueId)
    .order("total_points", { ascending: false });

  for (let i = 0; i < (ranked || []).length; i++) {
    await supabaseAdmin
      .from("fantasy_participants")
      .update({ rank: i + 1 })
      .eq("id", ranked![i].id);
  }
}

// ——— 9. Finalize League ———

export async function finalizeLeague(leagueId: string) {
  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("id, prize_pool")
    .eq("id", leagueId)
    .single();

  if (!league) return;

  // Get ranked participants
  const { data: participants } = await supabaseAdmin
    .from("fantasy_participants")
    .select("id, user_id, rank")
    .eq("league_id", leagueId)
    .order("rank", { ascending: true });

  if (!participants || participants.length === 0) return;

  const dist = ECONOMY.FANTASY_PRIZE_DISTRIBUTION;
  for (let i = 0; i < Math.min(3, participants.length); i++) {
    const reward = Math.round(league.prize_pool * dist[i]);
    if (reward > 0) {
      const idemKey = `fantasy_prize_${leagueId}_rank${i + 1}`;
      await addCoins(participants[i].user_id, reward, "season_reward", {
        fantasy_league: leagueId,
        rank: i + 1,
      }, idemKey);
    }
  }

  // Badge for winner
  const winner = participants[0];
  if (winner) {
    await supabaseAdmin.from("user_badges").upsert({
      user_id: winner.user_id,
      badge_id: "fantasy_champion",
    }, { onConflict: "user_id,badge_id" });

    insertFeedEvent(winner.user_id, "fantasy_league_won", { leagueId });
  }

  // Mark completed
  await supabaseAdmin
    .from("fantasy_leagues")
    .update({ status: "completed" })
    .eq("id", leagueId);
}

// ——— 10. Get League Details ———

export async function getLeagueDetails(leagueId: string, userId: string) {
  const { data: league } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("*, profiles!creator_id(id, username, avatar_url)")
    .eq("id", leagueId)
    .single();

  if (!league) throw new Error("Ligue introuvable");

  const { data: participants } = await supabaseAdmin
    .from("fantasy_participants")
    .select("*, profiles!user_id(id, username, avatar_url)")
    .eq("league_id", leagueId)
    .order("rank", { ascending: true });

  // Get teams for each participant
  const enrichedParticipants = [];
  for (const p of participants || []) {
    const { data: team } = await supabaseAdmin
      .from("fantasy_teams")
      .select("*, profiles!cyclist_id(id, username, avatar_url), user_stats!cyclist_id(ovr, tier, pac, mon, val, spr, \"end\", res)")
      .eq("participant_id", p.id);

    enrichedParticipants.push({
      ...p,
      user: (p as any).profiles,
      team: (team || []).map((t: any) => ({
        ...t,
        cyclist: {
          id: t.profiles?.id,
          username: t.profiles?.username,
          avatar_url: t.profiles?.avatar_url,
          ovr: t.user_stats?.ovr,
          tier: t.user_stats?.tier,
        },
      })),
    });
  }

  // Weekly scores
  const { data: weeklyScores } = await supabaseAdmin
    .from("fantasy_weekly_scores")
    .select("*")
    .in("participant_id", (participants || []).map((p: any) => p.id))
    .order("week_number", { ascending: true });

  const isParticipant = (participants || []).some((p: any) => p.user_id === userId);
  const myParticipant = (participants || []).find((p: any) => p.user_id === userId);

  return {
    league: {
      ...league,
      creator: (league as any).profiles,
      participant_count: (participants || []).length,
    },
    participants: enrichedParticipants,
    weeklyScores: weeklyScores || [],
    isParticipant,
    myParticipantId: myParticipant?.id || null,
  };
}

// ——— 11. Get My Leagues ———

export async function getMyLeagues(userId: string) {
  const { data: myParticipations } = await supabaseAdmin
    .from("fantasy_participants")
    .select("league_id")
    .eq("user_id", userId);

  const leagueIds = (myParticipations || []).map((p: any) => p.league_id);

  if (leagueIds.length === 0) return [];

  const { data: leagues } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("*, profiles!creator_id(id, username, avatar_url)")
    .in("id", leagueIds)
    .order("created_at", { ascending: false });

  // Enrich with participant counts
  const enriched = [];
  for (const league of leagues || []) {
    const { count } = await supabaseAdmin
      .from("fantasy_participants")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id);

    enriched.push({
      ...league,
      creator: (league as any).profiles,
      participant_count: count || 0,
    });
  }

  return enriched;
}

// ——— Public Leagues ———

export async function getPublicLeagues() {
  const { data: leagues } = await supabaseAdmin
    .from("fantasy_leagues")
    .select("*, profiles!creator_id(id, username, avatar_url)")
    .eq("is_public", true)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(20);

  const enriched = [];
  for (const league of leagues || []) {
    const { count } = await supabaseAdmin
      .from("fantasy_participants")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id);

    enriched.push({
      ...league,
      creator: (league as any).profiles,
      participant_count: count || 0,
    });
  }

  return enriched;
}
