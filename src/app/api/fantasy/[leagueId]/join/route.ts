import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID, validateBody } from "@/lib/api-utils";
import { joinLeague } from "@/services/fantasy.service";
import { fantasyJoinSchema } from "@/schemas";

/**
 * POST /api/fantasy/:leagueId/join — Rejoindre une ligue
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
    const body = await request.json().catch(() => ({}));
    const validated = validateBody(fantasyJoinSchema, body);
    if (validated instanceof Response) return validated;

    // Join by ID or invite code
    const result = await joinLeague(auth.profileId, validated.inviteCode || leagueId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Solde insuffisant") {
        return Response.json({ error: "Solde insuffisant" }, { status: 400 });
      }
      if (err.message.includes("inscrit") || err.message.includes("complet") || err.message.includes("introuvable") || err.message.includes("closes") || err.message.includes("invalide")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "FANTASY_JOIN");
  }
}
