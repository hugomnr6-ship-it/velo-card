import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { AppError } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export async function listItem(
  sellerId: string,
  itemType: string,
  itemId: string,
  price: number,
) {
  // Verify seller owns the item
  const { data: inventory } = await supabaseAdmin
    .from("user_inventory")
    .select("id")
    .eq("user_id", sellerId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .single();

  if (!inventory) {
    throw new AppError("NOT_OWNED", "Tu ne possèdes pas cet item", 400);
  }

  // Check not already listed
  const { data: existing } = await supabaseAdmin
    .from("marketplace_listings")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("item_id", itemId)
    .eq("status", "active")
    .single();

  if (existing) {
    throw new AppError("ALREADY_LISTED", "Cet item est déjà en vente", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .insert({ seller_id: sellerId, item_type: itemType, item_id: itemId, price })
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    userId: sellerId,
    action: "marketplace_list",
    resourceType: "marketplace_listing",
    resourceId: data.id,
    metadata: { itemType, itemId, price },
  });

  return data;
}

export async function buyItem(buyerId: string, listingId: string) {
  // Atomic: get listing and check status
  const { data: listing, error: fetchError } = await supabaseAdmin
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .eq("status", "active")
    .single();

  if (fetchError || !listing) {
    throw new AppError("NOT_AVAILABLE", "Ce listing n'est plus disponible", 404);
  }

  if (listing.seller_id === buyerId) {
    throw new AppError("SELF_BUY", "Tu ne peux pas acheter ton propre item", 400);
  }

  // Check buyer balance
  const { data: buyerProfile } = await supabaseAdmin
    .from("profiles")
    .select("coins_balance")
    .eq("id", buyerId)
    .single();

  if (!buyerProfile || buyerProfile.coins_balance < listing.price) {
    throw new AppError("INSUFFICIENT_FUNDS", "Solde insuffisant", 400);
  }

  // Atomic update listing status (optimistic lock via status check)
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("marketplace_listings")
    .update({ status: "sold", buyer_id: buyerId, sold_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("status", "active")
    .select()
    .single();

  if (updateError || !updated) {
    throw new AppError("RACE_CONDITION", "Ce listing vient d'être acheté", 409);
  }

  // Transfer coins: buyer pays, seller receives
  await addCoins(buyerId, -listing.price, "marketplace_buy", { listingId }, `mp_buy_${listingId}`);
  await addCoins(listing.seller_id, listing.price, "marketplace_sell", { listingId }, `mp_sell_${listingId}`);

  // Transfer item ownership
  await supabaseAdmin
    .from("user_inventory")
    .update({ user_id: buyerId })
    .eq("user_id", listing.seller_id)
    .eq("item_type", listing.item_type)
    .eq("item_id", listing.item_id);

  await logAudit({
    userId: buyerId,
    action: "marketplace_buy",
    resourceType: "marketplace_listing",
    resourceId: listingId,
    metadata: { sellerId: listing.seller_id, price: listing.price, itemType: listing.item_type },
  });

  return updated;
}

export async function cancelListing(sellerId: string, listingId: string) {
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .update({ status: "cancelled" })
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .select()
    .single();

  if (error || !data) {
    throw new AppError("NOT_FOUND", "Listing introuvable ou déjà vendu", 404);
  }

  return data;
}

export async function getActiveListings(filters: {
  type?: string;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  let query = supabaseAdmin
    .from("marketplace_listings")
    .select("*, seller:profiles!seller_id(username, avatar_url)")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  if (filters.type && filters.type !== "all") {
    query = query.eq("item_type", filters.type);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  switch (filters.sortBy) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getMyListings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .select("*, buyer:profiles!buyer_id(username)")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
