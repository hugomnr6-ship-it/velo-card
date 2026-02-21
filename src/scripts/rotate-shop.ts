/**
 * Shop rotation script — run weekly (Monday 00:00 UTC)
 * For MVP: execute manually or via Vercel cron
 *
 * Usage: npx tsx src/scripts/rotate-shop.ts
 */
import { supabaseAdmin } from "@/lib/supabase";

async function rotateShop() {
  // 1. Désactiver la rotation courante
  await supabaseAdmin
    .from("shop_rotations")
    .update({ is_active: false })
    .eq("is_active", true);

  // 2. Créer nouvelle rotation
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: rotation } = await supabaseAdmin
    .from("shop_rotations")
    .insert({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
    .select()
    .single();

  if (!rotation) throw new Error("Erreur création rotation");

  // 3. Sélectionner 4-6 skins aléatoires
  const { data: allSkins } = await supabaseAdmin
    .from("card_skins")
    .select("id, rarity, cost_coins")
    .eq("is_active", true);

  if (!allSkins || allSkins.length === 0) return;

  // Mélanger et prendre 4 à 6 skins
  const shuffled = allSkins.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(6, shuffled.length));

  // Le skin legendary le plus cher = featured
  const featured = selected.reduce((best, curr) => {
    const order: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
    return (order[curr.rarity] || 0) > (order[best.rarity] || 0) ? curr : best;
  });

  const items = selected.map((skin, i) => ({
    rotation_id: rotation.id,
    skin_id: skin.id,
    price_coins: skin.cost_coins || 500,
    is_featured: skin.id === featured.id,
    sort_order: skin.id === featured.id ? 0 : i + 1,
  }));

  await supabaseAdmin.from("shop_rotation_items").insert(items);

  console.log(`Shop rotation created: ${selected.length} skins until ${endsAt.toISOString()}`);
}

rotateShop();
