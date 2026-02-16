import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getDuelsForUser, createDuel } from "@/services/duel.service";
import { createDuelSchema } from "@/schemas";

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
