import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID, validateBody } from "@/lib/api-utils";
import { makeTransfer, getLeagueDetails } from "@/services/fantasy.service";
import { fantasyTransferSchema } from "@/schemas";

/**
 * POST /api/fantasy/:leagueId/transfer — Faire un transfert
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
    const validated = validateBody(fantasyTransferSchema, body);
    if (validated instanceof Response) return validated;

    // Find user's participant ID
    const details = await getLeagueDetails(leagueId, auth.profileId);
    if (!details.myParticipantId) {
      return Response.json({ error: "Vous n'êtes pas inscrit dans cette ligue" }, { status: 403 });
    }

    const result = await makeTransfer(
      details.myParticipantId,
      validated.droppedCyclistId,
      validated.pickedCyclistId,
    );
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Solde insuffisant") {
        return Response.json({ error: "Solde insuffisant" }, { status: 400 });
      }
      if (err.message.includes("introuvable") || err.message.includes("deja") || err.message.includes("active") || err.message.includes("Transferts")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "FANTASY_TRANSFER");
  }
}
