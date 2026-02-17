import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { getAvailableCyclists } from "@/services/fantasy.service";

/**
 * GET /api/fantasy/:leagueId/available — Cyclistes disponibles pour le draft
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
    const cyclists = await getAvailableCyclists(leagueId);
    return Response.json(cyclists);
  } catch (err) {
    return handleApiError(err, "FANTASY_AVAILABLE");
  }
}
