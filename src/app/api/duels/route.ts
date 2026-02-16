import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getDuelsForUser, createDuel } from "@/services/duel.service";
import { createDuelSchema } from "@/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const filter = new URL(request.url).searchParams.get("filter") || "all";

  try {
    const data = await getDuelsForUser(auth.profileId, filter);
    return Response.json(data);
  } catch (err) {
    return handleApiError(err, "DUELS_GET");
  }
}

export async function POST(request: Request) {
  const rateLimited = await checkRateLimit(getClientIp(request), "sensitive");
  if (rateLimited) return rateLimited;

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const validated = validateBody(createDuelSchema, body);
  if (validated instanceof Response) return validated;

  try {
    const duel = await createDuel(auth.profileId, validated);
    return Response.json({ duel });
  } catch (err) {
    return handleApiError(err, "DUELS_POST");
  }
}
