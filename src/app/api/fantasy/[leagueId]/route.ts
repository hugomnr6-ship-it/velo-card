import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { getLeagueDetails } from "@/services/fantasy.service";

/**
 * GET /api/fantasy/:leagueId — Détails complet d'une ligue
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  if (!isValidUUID(leagueId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const details = await getLeagueDetails(leagueId, auth.profileId);
    return Response.json(details);
  } catch (err) {
    if (err instanceof Error && err.message.includes("introuvable")) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    return handleApiError(err, "FANTASY_DETAILS");
  }
}
