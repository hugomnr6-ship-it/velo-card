import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import type { DuelCategory } from "@/types";

/**
 * POST /api/duels/:duelId/accept
 * Accept a duel challenge. For instant duels, resolves immediately.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const { duelId } = await params;
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  // Fetch duel
  const { data: duel, error: duelError } = await supabaseAdmin
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single();

  if (duelError || !duel) return Response.json({ error: "Duel introuvable" }, { status: 404 });

  // Only the opponent can accept
  if (duel.opponent_id !== profileId) {
    return Response.json({ error: "Seul l'adversaire peut accepter" }, { status: 403 });
  }

  if (duel.status !== "pending") {
    return Response.json({ error: "Ce duel n'est plus en attente" }, { status: 409 });
  }

  // Check not expired
  if (new Date(duel.expires_at) < new Date()) {
    await supabaseAdmin.from("duels").update({ status: "expired" }).eq("id", duelId);
    return Response.json({ error: "Ce duel a expiré" }, { status: 410 });
  }

  if (duel.duel_type === "instant") {
    // Atomic status check: only update if still pending
    const { data: locked, error: lockError } = await supabaseAdmin
      .from("duels")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", duelId)
      .eq("status", "pending")
      .select()
      .single();

    if (lockError || !locked) {
      return Response.json(
        { error: "Ce duel n'est plus disponible" },
        { status: 409 },
      );
    }

    const result = await resolveInstantDuel(locked);
    return Response.json({ duel: result });
  } else {
    // Weekly duel — atomic accept
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("duels")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", duelId)
      .eq("status", "pending")
      .select()
      .single();

    if (updateError || !updated) {
      return Response.json(
        { error: "Ce duel n'est plus disponible" },
        { status: 409 },
      );
    }

    return Response.json({ duel: updated });
  }
}

async function resolveInstantDuel(duel: any) {
  const category: DuelCategory = duel.category;
  const statCategories = ["ovr", "pac", "mon", "val", "spr", "end", "res"];

  let challengerValue: number;
  let opponentValue: number;

  if (statCategories.includes(category)) {
    // Fetch current card stats
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("user_id, pac, end, mon, res, spr, val, ovr")
      .in("user_id", [duel.challenger_id, duel.opponent_id]);

    const statsMap: Record<string, any> = {};
    for (const s of stats || []) statsMap[s.user_id] = s;

    challengerValue = statsMap[duel.challenger_id]?.[category] || 0;
    opponentValue = statsMap[duel.opponent_id]?.[category] || 0;
  } else {
    // Weekly performance — fetch this week's activities
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const getWeeklyValue = async (userId: string): Promise<number> => {
      const { data: activities } = await supabaseAdmin
        .from("strava_activities")
        .select("distance, total_elevation_gain")
        .eq("user_id", userId)
        .eq("activity_type", "Ride")
        .gte("start_date", monday.toISOString());

      const acts = activities || [];
      if (category === "weekly_km") return acts.reduce((s, a) => s + a.distance / 1000, 0);
      if (category === "weekly_dplus") return acts.reduce((s, a) => s + a.total_elevation_gain, 0);
      if (category === "weekly_rides") return acts.length;
      return 0;
    };

    challengerValue = await getWeeklyValue(duel.challenger_id);
    opponentValue = await getWeeklyValue(duel.opponent_id);
  }

  // Determine winner
  const isDraw = Math.round(challengerValue * 10) === Math.round(opponentValue * 10);
  const winnerId = isDraw ? null : (challengerValue > opponentValue ? duel.challenger_id : duel.opponent_id);
  const loserId = isDraw ? null : (winnerId === duel.challenger_id ? duel.opponent_id : duel.challenger_id);

  // Update duel
  const now = new Date().toISOString();
  const { data: resolved } = await supabaseAdmin
    .from("duels")
    .update({
      status: "resolved",
      accepted_at: now,
      resolved_at: now,
      challenger_value: Math.round(challengerValue * 10) / 10,
      opponent_value: Math.round(opponentValue * 10) / 10,
      winner_id: winnerId,
      is_draw: isDraw,
    })
    .eq("id", duel.id)
    .eq("status", "accepted")
    .select()
    .single();

  if (!resolved) {
    return { error: "Duel déjà résolu" };
  }

  // Update ego points
  if (winnerId && loserId) {
    await supabaseAdmin.rpc("increment_ego_points", { uid: winnerId, pts: duel.stake });
    await supabaseAdmin.rpc("increment_ego_points", { uid: loserId, pts: -duel.stake });

    // Feed events for duel result
    const { data: winnerProfile } = await supabaseAdmin.from("profiles").select("username").eq("id", winnerId).single();
    const { data: loserProfile } = await supabaseAdmin.from("profiles").select("username").eq("id", loserId).single();

    insertFeedEvent(winnerId, "duel_won", {
      opponent_name: loserProfile?.username || "?",
      category,
      stake: duel.stake,
    });
    insertFeedEvent(loserId, "duel_lost", {
      opponent_name: winnerProfile?.username || "?",
      category,
      stake: duel.stake,
    });
  } else if (isDraw) {
    insertFeedEvent(duel.challenger_id, "duel_draw", { category, stake: duel.stake });
    insertFeedEvent(duel.opponent_id, "duel_draw", { category, stake: duel.stake });
  }

  return resolved;
}
