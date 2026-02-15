import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/duels/:duelId/decline
 * Decline a duel challenge
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const { duelId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) return Response.json({ error: "Profil introuvable" }, { status: 404 });

  const { data: duel } = await supabaseAdmin
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single();

  if (!duel) return Response.json({ error: "Duel introuvable" }, { status: 404 });

  // Only the opponent can decline
  if (duel.opponent_id !== profile.id) {
    return Response.json({ error: "Seul l'adversaire peut décliner" }, { status: 403 });
  }

  if (duel.status !== "pending") {
    return Response.json({ error: "Ce duel n'est plus en attente" }, { status: 409 });
  }

  const { data: updated } = await supabaseAdmin
    .from("duels")
    .update({ status: "declined" })
    .eq("id", duelId)
    .select()
    .single();

  return Response.json({ duel: updated });
}
