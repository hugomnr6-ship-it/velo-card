import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { insertFeedEvent } from "@/lib/feed";

/**
 * Open a pack: verify balance, deduct coins, draw random items.
 * Uses idempotency key to prevent double-open on retry.
 */
export async function openPack(userId: string, packId: string, idempotencyKey?: string) {
  // Generate idempotency key if not provided
  const idemKey = idempotencyKey || `pack_open_${userId}_${packId}_${Date.now()}`;

  // 1. Verify pack exists
  const { data: pack } = await supabaseAdmin
    .from("pack_definitions")
    .select("*")
    .eq("id", packId)
    .eq("is_active", true)
    .single();

  if (!pack) throw new Error("Pack introuvable");

  // 2. Deduct coins with idempotency (throws if insufficient)
  await addCoins(userId, -pack.cost_coins, "pack_open", { packId }, idemKey);

  // 3. Draw random items
  const weights = pack.rarity_weights as Record<string, number>;
  const items = await drawItems(pack.items_count, weights);

  // 4. Add items to inventory
  const inventoryRows = items.map((item: any) => ({
    user_id: userId,
    item_id: item.id,
    obtained_from: packId,
    is_active: item.item_type === "stat_boost",
    expires_at: item.item_type === "stat_boost"
      ? new Date(Date.now() + (item.effect?.duration_weeks || 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null,
  }));

  await supabaseAdmin.from("user_inventory").insert(inventoryRows);

  // 5. Apply immediate effects (bonus coins)
  for (const item of items) {
    if (item.item_type === "coins") {
      await addCoins(userId, item.effect.coins, "quest_complete", {
        source: "pack",
        itemId: item.id,
      });
    }
  }

  // 6. Log the opening
  await supabaseAdmin.from("pack_opens").insert({
    user_id: userId,
    pack_id: packId,
    items_received: items.map((i: any) => ({ item_id: i.id, rarity: i.rarity, name: i.name })),
  });

  // 7. Feed event
  const rarityOrder: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const bestItem = items.reduce((best: any, curr: any) =>
    (rarityOrder[curr.rarity] || 0) > (rarityOrder[best.rarity] || 0) ? curr : best
  );

  insertFeedEvent(userId, "pack_opened", {
    packId,
    bestItemName: bestItem.name,
    bestItemRarity: bestItem.rarity,
    itemCount: items.length,
  });

  return { items, pack };
}

/**
 * Draw N random items weighted by rarity.
 */
async function drawItems(count: number, weights: Record<string, number>) {
  const { data: allItems } = await supabaseAdmin
    .from("pack_items")
    .select("*")
    .eq("is_active", true);

  if (!allItems || allItems.length === 0) return [];

  const items: any[] = [];
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);

  for (let i = 0; i < count; i++) {
    let roll = Math.random() * totalWeight;
    let selectedRarity = "common";
    for (const [rarity, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) {
        selectedRarity = rarity;
        break;
      }
    }

    const candidates = allItems.filter((it) => it.rarity === selectedRarity);
    if (candidates.length > 0) {
      items.push(candidates[Math.floor(Math.random() * candidates.length)]);
    } else {
      const commons = allItems.filter((it) => it.rarity === "common");
      if (commons.length > 0) {
        items.push(commons[Math.floor(Math.random() * commons.length)]);
      }
    }
  }

  return items;
}

/**
 * Get available packs.
 */
export async function getAvailablePacks() {
  const { data } = await supabaseAdmin
    .from("pack_definitions")
    .select("id, name, description, icon, cost_coins, items_count")
    .eq("is_active", true);

  return data || [];
}

/**
 * Get user inventory (active items).
 */
export async function getUserInventory(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_inventory")
    .select("*, pack_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []).map((inv: any) => ({
    id: inv.id,
    item: inv.pack_items,
    obtained_from: inv.obtained_from,
    is_active: inv.is_active,
    expires_at: inv.expires_at,
    equipped: inv.equipped,
    created_at: inv.created_at,
  }));
}
