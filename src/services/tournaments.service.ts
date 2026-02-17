import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { insertFeedEvent } from "@/lib/feed";
import { ECONOMY } from "@/lib/economy";

/**
 * Join a tournament: verify coins, register, add to prize pool.
 */
export async function joinTournament(userId: string, tournamentId: string) {
  const { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .eq("status", "registration")
    .single();

  if (!tournament) throw new Error("Tournoi introuvable ou inscriptions fermees");

  // Check not already registered
  const { data: existing } = await supabaseAdmin
    .from("tournament_participants")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();

  if (existing) throw new Error("Deja inscrit");

  // Check participant count
  const { count } = await supabaseAdmin
    .from("tournament_participants")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if ((count || 0) >= tournament.max_participants) {
    throw new Error("Tournoi complet");
  }

  // Deduct entry cost with idempotency
  if (tournament.entry_cost_coins > 0) {
    const idemKey = `tournament_join_${userId}_${tournamentId}`;
    await addCoins(userId, -tournament.entry_cost_coins, "tournament_entry", { tournamentId }, idemKey);
  }

  // Register participant
  await supabaseAdmin.from("tournament_participants").insert({
    tournament_id: tournamentId,
    user_id: userId,
  });

  // Update prize pool
  await supabaseAdmin
    .from("tournaments")
    .update({ prize_pool_coins: tournament.prize_pool_coins + tournament.entry_cost_coins })
    .eq("id", tournamentId);

  return { success: true };
}

/**
 * Generate bracket: seed players by OVR, create round 1 matches.
 */
export async function generateBracket(tournamentId: string): Promise<void> {
  const { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("category")
    .eq("id", tournamentId)
    .single();

  if (!tournament) return;

  // Get participants with OVR
  const { data: participants } = await supabaseAdmin
    .from("tournament_participants")
    .select("user_id")
    .eq("tournament_id", tournamentId);

  if (!participants || participants.length < 2) return;

  const userIds = participants.map((p: any) => p.user_id);

  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, ovr")
    .in("user_id", userIds);

  const statsMap = new Map((stats || []).map((s: any) => [s.user_id, s.ovr || 0]));

  // Sort by OVR descending
  const sorted = userIds
    .map((uid) => ({ user_id: uid, ovr: statsMap.get(uid) || 0 }))
    .sort((a, b) => b.ovr - a.ovr);

  // Assign seeds
  for (let i = 0; i < sorted.length; i++) {
    await supabaseAdmin
      .from("tournament_participants")
      .update({ seed: i + 1 })
      .eq("tournament_id", tournamentId)
      .eq("user_id", sorted[i].user_id);
  }

  // Pad to next power of 2
  let n = 1;
  while (n < sorted.length) n *= 2;

  const players: (string | null)[] = sorted.map((s) => s.user_id);
  while (players.length < n) players.push(null); // byes

  // Create round 1 matches (seed 1 vs last, seed 2 vs before-last, etc.)
  const matches: { player_a: string | null; player_b: string | null }[] = [];
  for (let i = 0; i < n / 2; i++) {
    matches.push({
      player_a: players[i],
      player_b: players[n - 1 - i],
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const isBye = m.player_a === null || m.player_b === null;

    await supabaseAdmin.from("tournament_matches").insert({
      tournament_id: tournamentId,
      round: 1,
      match_number: i + 1,
      player_a_id: m.player_a,
      player_b_id: m.player_b,
      winner_id: isBye ? (m.player_a || m.player_b) : null,
      status: isBye ? "bye" : "pending",
      resolved_at: isBye ? new Date().toISOString() : null,
    });
  }

  // Update tournament status
  await supabaseAdmin
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);
}

/**
 * Resolve a match: compare the category stat of both players.
 */
export async function resolveMatch(matchId: string): Promise<void> {
  const { data: match } = await supabaseAdmin
    .from("tournament_matches")
    .select("*, tournaments!inner(category, id)")
    .eq("id", matchId)
    .single();

  if (!match || match.status !== "pending") return;
  if (!match.player_a_id || !match.player_b_id) return;

  const category = (match as any).tournaments?.category || "ovr";
  const tournamentId = (match as any).tournaments?.id;

  // Get stats for both players
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, pac, end, mon, res, spr, val, ovr")
    .in("user_id", [match.player_a_id, match.player_b_id]);

  const statsMap: Record<string, any> = {};
  for (const s of stats || []) statsMap[s.user_id] = s;

  const valA = statsMap[match.player_a_id]?.[category] || 0;
  const valB = statsMap[match.player_b_id]?.[category] || 0;

  const winnerId = valA >= valB ? match.player_a_id : match.player_b_id;
  const loserId = winnerId === match.player_a_id ? match.player_b_id : match.player_a_id;

  // Update match
  await supabaseAdmin
    .from("tournament_matches")
    .update({
      winner_id: winnerId,
      player_a_value: valA,
      player_b_value: valB,
      status: "finished",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  // Eliminate loser
  await supabaseAdmin
    .from("tournament_participants")
    .update({ is_eliminated: true })
    .eq("tournament_id", tournamentId)
    .eq("user_id", loserId);

  // Check if round is complete → generate next round
  await advanceRound(tournamentId, match.round);
}

/**
 * If all matches in a round are done, generate the next round.
 */
async function advanceRound(tournamentId: string, currentRound: number): Promise<void> {
  const { data: roundMatches } = await supabaseAdmin
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", currentRound);

  if (!roundMatches) return;

  // Check if all matches are resolved
  const allDone = roundMatches.every((m: any) => m.status === "finished" || m.status === "bye");
  if (!allDone) return;

  const winners = roundMatches
    .filter((m: any) => m.winner_id)
    .sort((a: any, b: any) => a.match_number - b.match_number)
    .map((m: any) => m.winner_id);

  if (winners.length <= 1) {
    // Tournament is over — finalize
    await finalizeTournament(tournamentId, winners[0]);
    return;
  }

  // Create next round
  const nextRound = currentRound + 1;
  for (let i = 0; i < winners.length; i += 2) {
    const playerA = winners[i];
    const playerB = winners[i + 1] || null;
    const isBye = !playerB;

    await supabaseAdmin.from("tournament_matches").insert({
      tournament_id: tournamentId,
      round: nextRound,
      match_number: Math.floor(i / 2) + 1,
      player_a_id: playerA,
      player_b_id: playerB,
      winner_id: isBye ? playerA : null,
      status: isBye ? "bye" : "pending",
      resolved_at: isBye ? new Date().toISOString() : null,
    });
  }
}

/**
 * Finalize a tournament: distribute prizes.
 */
async function finalizeTournament(tournamentId: string, winnerId: string | null): Promise<void> {
  const { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("prize_pool_coins, name")
    .eq("id", tournamentId)
    .single();

  if (!tournament) return;

  const pool = tournament.prize_pool_coins || 0;

  if (winnerId) {
    // Winner gets configured % of pool
    const winnerPrize = Math.round(pool * ECONOMY.TOURNAMENT_PRIZE_WINNER_PCT);
    const idemKey = `tournament_prize_${tournamentId}_${winnerId}`;
    await addCoins(winnerId, winnerPrize, "season_reward", {
      source: "tournament_prize",
      tournamentId,
      position: 1,
    }, idemKey);

    await supabaseAdmin
      .from("tournament_participants")
      .update({ final_rank: 1 })
      .eq("tournament_id", tournamentId)
      .eq("user_id", winnerId);

    insertFeedEvent(winnerId, "tournament_won", {
      tournamentId,
      tournamentName: tournament.name,
      prizeCoins: winnerPrize,
    });
  }

  await supabaseAdmin
    .from("tournaments")
    .update({ status: "finished", ends_at: new Date().toISOString() })
    .eq("id", tournamentId);
}

/**
 * Get tournament detail with bracket.
 */
export async function getTournamentDetail(tournamentId: string) {
  const { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (!tournament) return null;

  const { count } = await supabaseAdmin
    .from("tournament_participants")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  const { data: matches } = await supabaseAdmin
    .from("tournament_matches")
    .select("id, round, match_number, player_a_id, player_b_id, winner_id, player_a_value, player_b_value, status")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true });

  // Get player names for matches
  const playerIds = new Set<string>();
  for (const m of matches || []) {
    if (m.player_a_id) playerIds.add(m.player_a_id);
    if (m.player_b_id) playerIds.add(m.player_b_id);
  }

  const { data: players } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", Array.from(playerIds).length > 0 ? Array.from(playerIds) : ["none"]);

  const { data: playerStats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, ovr")
    .in("user_id", Array.from(playerIds).length > 0 ? Array.from(playerIds) : ["none"]);

  const profileMap = new Map((players || []).map((p: any) => [p.id, p]));
  const statsMap = new Map((playerStats || []).map((s: any) => [s.user_id, s.ovr]));

  const enrichedMatches = (matches || []).map((m: any) => ({
    id: m.id,
    round: m.round,
    match_number: m.match_number,
    player_a: m.player_a_id ? {
      id: m.player_a_id,
      username: profileMap.get(m.player_a_id)?.username || "?",
      ovr: statsMap.get(m.player_a_id) || 0,
    } : null,
    player_b: m.player_b_id ? {
      id: m.player_b_id,
      username: profileMap.get(m.player_b_id)?.username || "?",
      ovr: statsMap.get(m.player_b_id) || 0,
    } : null,
    winner_id: m.winner_id,
    player_a_value: m.player_a_value,
    player_b_value: m.player_b_value,
    status: m.status,
  }));

  return {
    ...tournament,
    participants_count: count || 0,
    matches: enrichedMatches,
  };
}
