import { supabaseAdmin } from "@/lib/supabase";
import type { DuelCategory } from "@/types";

// Catégories possibles pour le duel du jour (stats uniquement, pas weekly)
const DUEL_CATEGORIES: DuelCategory[] = ["ovr", "pac", "mon", "val", "spr", "end", "res"];

/**
 * Récupère ou génère le duel du jour pour un utilisateur.
 * Matchmaking : trouve un adversaire avec OVR ±5.
 */
export async function getDailyDuel(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Vérifier si un duel du jour existe déjà
  const { data: existing } = await supabaseAdmin
    .from("daily_duels")
    .select(`
      *,
      opponent:profiles!opponent_id (id, username, avatar_url),
      opponent_stats:user_stats!opponent_id (ovr, tier)
    `)
    .eq("user_id", userId)
    .eq("duel_date", today)
    .single();

  if (existing) {
    return formatDailyDuel(existing);
  }

  // Générer un nouveau duel du jour
  return generateDailyDuel(userId, today);
}

/**
 * Génère un nouveau duel du jour via matchmaking OVR ±5.
 */
export async function generateDailyDuel(userId: string, today: string) {
  // Récupérer l'OVR de l'utilisateur
  const { data: userStats } = await supabaseAdmin
    .from("user_stats")
    .select("ovr")
    .eq("user_id", userId)
    .single();

  if (!userStats) return null;

  const userOvr = userStats.ovr;
  const minOvr = Math.max(0, userOvr - 5);
  const maxOvr = Math.min(99, userOvr + 5);

  // Trouver un adversaire dans la range OVR ±5
  // Exclure l'utilisateur lui-même et ceux qui ont déjà un duel du jour avec lui
  const { data: candidates } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, ovr")
    .neq("user_id", userId)
    .gte("ovr", minOvr)
    .lte("ovr", maxOvr)
    .order("ovr", { ascending: false })
    .limit(20);

  if (!candidates || candidates.length === 0) return null;

  // Sélection aléatoire parmi les candidats
  const opponent = candidates[Math.floor(Math.random() * candidates.length)];

  // Catégorie aléatoire
  const category = DUEL_CATEGORIES[Math.floor(Math.random() * DUEL_CATEGORIES.length)];

  // Insérer le duel du jour
  const { data: dailyDuel, error } = await supabaseAdmin
    .from("daily_duels")
    .insert({
      user_id: userId,
      opponent_id: opponent.user_id,
      category,
      duel_date: today,
      status: "proposed",
    })
    .select(`
      *,
      opponent:profiles!opponent_id (id, username, avatar_url),
      opponent_stats:user_stats!opponent_id (ovr, tier)
    `)
    .single();

  if (error) {
    // Probablement un conflit unique (race condition)
    if (error.code === "23505") {
      const { data: retry } = await supabaseAdmin
        .from("daily_duels")
        .select(`
          *,
          opponent:profiles!opponent_id (id, username, avatar_url),
          opponent_stats:user_stats!opponent_id (ovr, tier)
        `)
        .eq("user_id", userId)
        .eq("duel_date", today)
        .single();
      return retry ? formatDailyDuel(retry) : null;
    }
    throw error;
  }

  return formatDailyDuel(dailyDuel);
}

/**
 * Accepter le duel du jour (crée un vrai duel).
 */
export async function acceptDailyDuel(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: dd } = await supabaseAdmin
    .from("daily_duels")
    .select("*")
    .eq("user_id", userId)
    .eq("duel_date", today)
    .eq("status", "proposed")
    .single();

  if (!dd) {
    throw new Error("Aucun duel du jour disponible");
  }

  // Créer le vrai duel (instant, mise 10 coins)
  const { data: duel, error } = await supabaseAdmin
    .from("duels")
    .insert({
      challenger_id: userId,
      opponent_id: dd.opponent_id,
      category: dd.category,
      duel_type: "instant",
      stake: 10,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Mettre à jour le daily_duel
  await supabaseAdmin
    .from("daily_duels")
    .update({ status: "accepted", duel_id: duel.id })
    .eq("id", dd.id);

  return duel;
}

/**
 * Décliner le duel du jour.
 */
export async function declineDailyDuel(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  await supabaseAdmin
    .from("daily_duels")
    .update({ status: "declined" })
    .eq("user_id", userId)
    .eq("duel_date", today)
    .eq("status", "proposed");
}

/**
 * Génère un duel du jour pour tous les utilisateurs actifs.
 * Appelé par le cron daily-reset.
 */
export async function generateDailyDuelsForAllUsers(
  users: { user_id: string }[],
): Promise<{ generated: number; errors: number }> {
  const today = new Date().toISOString().split("T")[0];
  let generated = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const result = await getDailyDuel(user.user_id);
      if (result) generated++;
    } catch {
      errors++;
    }
  }

  return { generated, errors };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDailyDuel(dd: any) {
  return {
    id: dd.id,
    category: dd.category,
    status: dd.status,
    duelId: dd.duel_id,
    opponent: {
      id: dd.opponent?.id || dd.opponent_id,
      username: dd.opponent?.username || "?",
      avatar_url: dd.opponent?.avatar_url || null,
      ovr: dd.opponent_stats?.ovr || 0,
      tier: dd.opponent_stats?.tier || "bronze",
    },
  };
}
