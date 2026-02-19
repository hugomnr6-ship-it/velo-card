import { NextRequest } from "next/server";
import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { createListingSchema, marketplaceQuerySchema } from "@/schemas/index";
import { listItem, getActiveListings } from "@/services/marketplace.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = validateBody(marketplaceQuerySchema, {
      type: searchParams.get("type") || "all",
      sortBy: searchParams.get("sortBy") || "newest",
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    });
    if (filters instanceof Response) return filters;

    const listings = await getActiveListings(filters);
    return Response.json(listings);
  } catch (err) {
    return handleApiError(err, "MARKETPLACE_LIST");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (isErrorResponse(authResult)) return authResult;

    const body = await req.json();
    const data = validateBody(createListingSchema, body);
    if (data instanceof Response) return data;

    const listing = await listItem(authResult.profileId, data.itemType, data.itemId, data.price);
    return Response.json(listing, { status: 201 });
  } catch (err) {
    return handleApiError(err, "MARKETPLACE_CREATE");
  }
}
