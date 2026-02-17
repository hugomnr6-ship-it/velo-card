import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getAvailablePacks } from "@/services/packs.service";

/**
 * GET /api/packs — list available packs with costs
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const packs = await getAvailablePacks();
    return Response.json(packs);
  } catch (err) {
    return handleApiError(err, "PACKS_LIST");
  }
}
