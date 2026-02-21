import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getCurrentShop, getUserOwnedSkinIds } from "@/services/shop.service";

/**
 * GET /api/shop — current shop rotation with ownership info
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const shop = await getCurrentShop();
    const ownedIds = await getUserOwnedSkinIds(auth.profileId);

    const itemsWithOwnership = shop.items.map((item) => ({
      ...item,
      owned: ownedIds.includes(item.skinId),
    }));

    return Response.json({
      rotation: shop.rotation,
      items: itemsWithOwnership,
    });
  } catch (err) {
    return handleApiError(err, "SHOP_LIST");
  }
}
