import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getWeeklyLeaderboard } from "@/services/leaderboard.service";
import { leaderboardQuerySchema } from "@/schemas";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const validated = validateBody(leaderboardQuerySchema, params);
  if (validated instanceof Response) return validated;

  try {
    const entries = await getWeeklyLeaderboard(validated.region, validated.sort);
    return Response.json(entries);
  } catch (err) {
    return handleApiError(err, "LEADERBOARD_GET");
  }
}
