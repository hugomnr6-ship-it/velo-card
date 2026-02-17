import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { removeCyclist, getLeagueDetails } from "@/services/fantasy.service";

/**
 * DELETE /api/fantasy/:leagueId/draft/:cyclistId — Retirer un cycliste du draft
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string; cyclistId: string }> }
) {
  const { leagueId, cyclistId } = await params;
  if (!isValidUUID(leagueId) || !isValidUUID(cyclistId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    // Find user's participant ID
    const details = await getLeagueDetails(leagueId, auth.profileId);
    if (!details.myParticipantId) {
      return Response.json({ error: "Vous n'êtes pas inscrit dans cette ligue" }, { status: 403 });
    }

    const result = await removeCyclist(details.myParticipantId, cyclistId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("draft") || err.message.includes("introuvable")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "FANTASY_REMOVE_CYCLIST");
  }
}
