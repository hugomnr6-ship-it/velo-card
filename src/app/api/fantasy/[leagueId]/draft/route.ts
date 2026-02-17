import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID, validateBody } from "@/lib/api-utils";
import { draftCyclist, getLeagueDetails } from "@/services/fantasy.service";
import { fantasyDraftSchema } from "@/schemas";

/**
 * POST /api/fantasy/:leagueId/draft — Drafter un cycliste
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  if (!isValidUUID(leagueId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const validated = validateBody(fantasyDraftSchema, body);
    if (validated instanceof Response) return validated;

    // Find user's participant ID in this league
    const details = await getLeagueDetails(leagueId, auth.profileId);
    if (!details.myParticipantId) {
      return Response.json({ error: "Vous n'êtes pas inscrit dans cette ligue" }, { status: 403 });
    }

    const result = await draftCyclist(
      details.myParticipantId,
      validated.cyclistId,
      validated.isCaptain,
      validated.isSuperSub,
    );
    return Response.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("complet") || err.message.includes("draft") || err.message.includes("Budget") || err.message.includes("capitaine") || err.message.includes("super-sub") || err.message.includes("introuvable") || err.message.includes("deja")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "FANTASY_DRAFT");
  }
}
