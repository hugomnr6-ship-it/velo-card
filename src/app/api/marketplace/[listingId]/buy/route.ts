import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { buyItem } from "@/services/marketplace.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (isErrorResponse(authResult)) return authResult;

    const { listingId } = await params;
    const result = await buyItem(authResult.profileId, listingId);
    return Response.json(result);
  } catch (err) {
    return handleApiError(err, "MARKETPLACE_BUY");
  }
}
