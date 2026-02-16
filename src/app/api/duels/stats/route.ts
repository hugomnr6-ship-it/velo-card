import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/duels/stats — Get duel W/L/D record and ego points for current user
 */
export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const userId = profileId;

  // Get all resolved duels involving this user
  const { data: duels } = await supabaseAdmin
    .from("duels")
    .select("winner_id, is_draw, stake, challenger_id, opponent_id")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .eq("status", "resolved");

  let wins = 0, losses = 0, draws = 0, egoPoints = 0;

  for (const d of duels || []) {
    if (d.is_draw) {
      draws++;
    } else if (d.winner_id === userId) {
      wins++;
      egoPoints += d.stake;
    } else {
      losses++;
      egoPoints -= d.stake;
    }
  }

  // Also get pending challenges received
  const { count: pendingReceived } = await supabaseAdmin
    .from("duels")
    .select("*", { count: "exact", head: true })
    .eq("opponent_id", userId)
    .eq("status", "pending");

  return Response.json({
    wins,
    losses,
    draws,
    ego_points: egoPoints,
    pending_received: pendingReceived || 0,
  });
}
