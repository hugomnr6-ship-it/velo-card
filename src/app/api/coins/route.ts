import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getCoinInfo } from "@/services/coins.service";

/**
 * GET /api/coins — returns the user's coin balance + totals
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const info = await getCoinInfo(auth.profileId);
    return Response.json(info);
  } catch (err) {
    return handleApiError(err, "COINS_GET");
  }
}
