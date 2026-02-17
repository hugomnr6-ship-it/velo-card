import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { createLeague, getMyLeagues, getPublicLeagues } from "@/services/fantasy.service";
import { createFantasyLeagueSchema } from "@/schemas";

/**
 * GET /api/fantasy — Mes ligues + ligues publiques ouvertes
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const [myLeagues, publicLeagues] = await Promise.all([
      getMyLeagues(auth.profileId),
      getPublicLeagues(),
    ]);

    return Response.json({ myLeagues, publicLeagues });
  } catch (err) {
    return handleApiError(err, "FANTASY_LIST");
  }
}

/**
 * POST /api/fantasy — Créer une ligue
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const validated = validateBody(createFantasyLeagueSchema, body);
    if (validated instanceof Response) return validated;

    const league = await createLeague(auth.profileId, validated);
    return Response.json(league, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Solde insuffisant") {
      return Response.json({ error: "Solde insuffisant" }, { status: 400 });
    }
    return handleApiError(err, "FANTASY_CREATE");
  }
}
