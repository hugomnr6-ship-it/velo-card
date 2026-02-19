import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { cancelListing } from "@/services/marketplace.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (isErrorResponse(authResult)) return authResult;

    const { listingId } = await params;
    const result = await cancelListing(authResult.profileId, listingId);
    return Response.json(result);
  } catch (err) {
    return handleApiError(err, "MARKETPLACE_CANCEL");
  }
}
