import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getUserInventory } from "@/services/packs.service";

/**
 * GET /api/inventory — user's inventory (boosts, skins, etc.)
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const inventory = await getUserInventory(auth.profileId);
    return Response.json(inventory);
  } catch (err) {
    return handleApiError(err, "INVENTORY_GET");
  }
}
