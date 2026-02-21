import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getWeeklyLeaderboard } from "@/services/leaderboard.service";
import { isUserPro } from "@/services/subscription.service";
import { cached } from "@/lib/cache";
import { leaderboardQuerySchema } from "@/schemas";
import { PRO_GATES } from "@/lib/pro-gates";

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
    // Gate Free/Pro : Free = top 20, Pro = complet + position exacte
    const isPro = await isUserPro(auth.profileId);
    let result = entries;
    if (!isPro && Array.isArray(entries)) {
      result = entries.slice(0, PRO_GATES.leaderboard.freeMaxEntries);
    }

    return Response.json({ entries: result, isPro, totalEntries: Array.isArray(entries) ? entries.length : 0 }, {
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
