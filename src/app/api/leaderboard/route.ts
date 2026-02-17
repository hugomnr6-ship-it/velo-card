import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getWeeklyLeaderboard } from "@/services/leaderboard.service";
import { cached } from "@/lib/cache";
import { leaderboardQuerySchema } from "@/schemas";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const validated = validateBody(leaderboardQuerySchema, params);
  if (validated instanceof Response) return validated;

  try {
    // If scope is "global" or "france", override region
    const effectiveRegion = validated.scope === "global" ? "global"
      : validated.scope === "france" ? "france"
      : validated.region;

    // Cache Redis 5 minutes
    const entries = await cached(
      `${effectiveRegion}:${validated.sort}`,
      () => getWeeklyLeaderboard(effectiveRegion, validated.sort),
      { ttl: 300, prefix: "leaderboard" }
    );
    return Response.json(entries, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
      },
    });
  } catch (err) {
    return handleApiError(err, "LEADERBOARD_GET");
  }
}
