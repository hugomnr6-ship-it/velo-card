import { supabaseAdmin } from "@/lib/supabase";
import { ECONOMY } from "@/lib/economy";
import { addCoins } from "./coins.service";
import { isUserPro } from "./subscription.service";
import { insertFeedEvent } from "@/lib/feed";

/**
 * Get current active shop rotation with items.
 */
export async function getCurrentShop() {
  const now = new Date().toISOString();

  const { data: rotation } = await supabaseAdmin
    .from("shop_rotations")
    .select("id, starts_at, ends_at")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: false })
    .limit(1)
    .single();

  if (!rotation) return { rotation: null, items: [] };

  const { data: items } = await supabaseAdmin
    .from("shop_rotation_items")
    .select("id, skin_id, price_coins, is_featured, sort_order, card_skins(*)")
    .eq("rotation_id", rotation.id)
    .order("sort_order", { ascending: true });

  return {
    rotation: {
      id: rotation.id,
      starts_at: rotation.starts_at,
      ends_at: rotation.ends_at,
    },
    items: (items || []).map((item: any) => ({
      id: item.id,
      skinId: item.skin_id,
      name: item.card_skins?.name || item.skin_id,
      description: item.card_skins?.description || "",
      skinType: item.card_skins?.skin_type || "border",
      rarity: item.card_skins?.rarity || "common",
      previewUrl: item.card_skins?.preview_url,
      priceCoins: item.price_coins,
      isFeatured: item.is_featured,
    })),
  };
}

/**
 * Buy a skin directly from the shop.
 */
export async function buySkin(userId: string, shopItemId: string) {
  // 1. Get shop item + verify rotation is active
  const now = new Date().toISOString();

  const { data: shopItem } = await supabaseAdmin
    .from("shop_rotation_items")
    .select("*, shop_rotations!inner(id, starts_at, ends_at, is_active), card_skins(rarity)")
    .eq("id", shopItemId)
    .single();

  if (!shopItem) throw new Error("Item introuvable dans le shop");

  const rotation = (shopItem as any).shop_rotations;
  if (!rotation.is_active || now < rotation.starts_at || now > rotation.ends_at) {
    throw new Error("Cette rotation du shop a expiré");
  }

  // 2. Vérifier si le skin est premium-only (epic/legendary)
  const skinRarity = (shopItem as any).card_skins?.rarity as string | undefined;
  if (skinRarity && ECONOMY.PREMIUM_SKIN_RARITIES.includes(skinRarity)) {
    const isPro = await isUserPro(userId);
    if (!isPro) {
      throw new Error("Ce skin est réservé aux abonnés Pro");
    }
  }

  // 3. Check user doesn't already own this skin
  const { data: existing } = await supabaseAdmin
    .from("user_inventory")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", shopItem.skin_id)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Tu possèdes déjà ce skin !");
  }

  // 4. Deduct coins
  const idemKey = `shop_buy_${userId}_${shopItemId}_${Date.now()}`;
  await addCoins(userId, -shopItem.price_coins, "skin_purchase", {
    skinId: shopItem.skin_id,
    shopItemId,
    rotationId: rotation.id,
  }, idemKey);

  // 5. Add to inventory
  await supabaseAdmin.from("user_inventory").insert({
    user_id: userId,
    item_id: shopItem.skin_id,
    obtained_from: "shop",
    is_active: true,
    equipped: false,
  });

  // 6. Log purchase
  await supabaseAdmin.from("skin_purchases").insert({
    user_id: userId,
    skin_id: shopItem.skin_id,
    price_paid: shopItem.price_coins,
    rotation_id: rotation.id,
  });

  // 7. Feed event
  insertFeedEvent(userId, "skin_purchased", {
    skinId: shopItem.skin_id,
    skinName: shopItem.skin_id,
    priceCoins: shopItem.price_coins,
  });

  return { success: true, skinId: shopItem.skin_id };
}

/**
 * Check which skins from current shop the user already owns.
 */
export async function getUserOwnedSkinIds(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("user_inventory")
    .select("item_id")
    .eq("user_id", userId);

  return (data || []).map((row: any) => row.item_id);
}
