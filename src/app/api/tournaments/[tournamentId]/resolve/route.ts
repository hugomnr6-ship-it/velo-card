import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveMatch } from "@/services/tournaments.service";

/**
 * POST /api/tournaments/:tournamentId/resolve — resolve pending matches
 * Can be called by admin/cron to advance the tournament.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  if (!isValidUUID(tournamentId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    // Get all pending matches for this tournament
    const { data: pendingMatches } = await supabaseAdmin
      .from("tournament_matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("status", "pending");

    let resolved = 0;
    for (const match of pendingMatches || []) {
      await resolveMatch(match.id);
      resolved++;
    }

    return Response.json({ resolved });
  } catch (err) {
    return handleApiError(err, "TOURNAMENT_RESOLVE");
  }
}
