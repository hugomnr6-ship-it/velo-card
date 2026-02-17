import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getActiveSeason, getUserSeasonStats } from "@/services/seasons.service";

/**
 * GET /api/seasons/me — user's position and stats in the active season
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const season = await getActiveSeason();
    if (!season) {
      return Response.json({ season: null, stats: null });
    }

    const stats = await getUserSeasonStats(auth.profileId, season.id);
    return Response.json({ season, stats });
  } catch (err) {
    return handleApiError(err, "SEASONS_ME");
  }
}
