import { getAuthenticatedUser, isErrorResponse, isValidUUID } from "@/lib/api-utils";
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
  if (!isValidUUID(duelId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { data: duel } = await supabaseAdmin
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single();

  if (!duel) return Response.json({ error: "Duel introuvable" }, { status: 404 });

  // Only the opponent can decline
  if (duel.opponent_id !== profileId) {
    return Response.json({ error: "Seul l'adversaire peut décliner" }, { status: 403 });
  }

  if (duel.status !== "pending") {
    return Response.json({ error: "Ce duel n'est plus en attente" }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("duels")
    .update({ status: "declined" })
    .eq("id", duelId)
    .eq("status", "pending")
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { error: "Ce duel n'est plus en attente" },
      { status: 409 },
    );
  }

  return Response.json({ duel: updated });
}
