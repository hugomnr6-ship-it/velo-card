import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { joinTournament } from "@/services/tournaments.service";

/**
 * POST /api/tournaments/:tournamentId/join — register for tournament
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
    const result = await joinTournament(auth.profileId, tournamentId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Solde insuffisant") {
        return Response.json({ error: "Solde insuffisant" }, { status: 400 });
      }
      if (err.message.includes("inscrit") || err.message.includes("complet") || err.message.includes("introuvable")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "TOURNAMENT_JOIN");
  }
}
