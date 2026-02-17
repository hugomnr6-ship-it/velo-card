import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { startLeague } from "@/services/fantasy.service";

/**
 * POST /api/fantasy/:leagueId/start — Lancer la ligue (créateur uniquement)
 */
export async function POST(
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
    const result = await startLeague(auth.profileId, leagueId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("createur")) {
        return Response.json({ error: err.message }, { status: 403 });
      }
      if (err.message.includes("introuvable") || err.message.includes("draft") || err.message.includes("Minimum")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "FANTASY_START");
  }
}
