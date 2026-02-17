import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { getTournamentDetail } from "@/services/tournaments.service";

/**
 * GET /api/tournaments/:tournamentId — detail + bracket
 */
export async function GET(
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
    const detail = await getTournamentDetail(tournamentId);
    if (!detail) {
      return Response.json({ error: "Tournoi introuvable" }, { status: 404 });
    }
    return Response.json(detail);
  } catch (err) {
    return handleApiError(err, "TOURNAMENT_DETAIL");
  }
}
