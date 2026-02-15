import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/duels/stats — Get duel W/L/D record and ego points for current user
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) return Response.json({ error: "Profil introuvable" }, { status: 404 });

  const userId = profile.id;

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
