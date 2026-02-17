import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getActiveSeason, getSeasonRanking } from "@/services/seasons.service";
import { cached } from "@/lib/cache";

/**
 * GET /api/seasons — active season + top 50 ranking
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    // Cache Redis 1 heure (les saisons changent rarement)
    const data = await cached(
      "current",
      async () => {
        const season = await getActiveSeason();
        if (!season) return { season: null, ranking: [] };
        const ranking = await getSeasonRanking(season.id, 50);
        return { season, ranking };
      },
      { ttl: 3600, prefix: "season" }
    );

    return Response.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err) {
    return handleApiError(err, "SEASONS_GET");
  }
}
