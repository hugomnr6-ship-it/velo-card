import { supabaseAdmin } from "@/lib/supabase";
import { AppError } from "@/lib/api-utils";
import type { CardTier } from "@/types";
import type { CreateDuelInput } from "@/schemas";

export async function getDuelsForUser(userId: string, filter: string) {
  // ═══ N+1 FIX: 1 requête avec JOINs au lieu de 3 (duels + profiles + stats) ═══
  let query = supabaseAdmin
    .from("duels")
    .select(`
      *,
      challenger:profiles!challenger_id (id, username, avatar_url),
      challenger_stats:user_stats!challenger_id (ovr, tier),
      opponent:profiles!opponent_id (id, username, avatar_url),
      opponent_stats:user_stats!opponent_id (ovr, tier)
    `)
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter === "pending") {
    query = query.eq("status", "pending");
  } else if (filter === "active") {
    query = query.eq("status", "accepted");
  } else if (filter === "history") {
    query = query.in("status", ["resolved", "declined", "expired"]);
  }

  const { data: duels, error } = await query;
  if (error) throw error;

  const enriched = (duels || []).map((d: any) => ({
    ...d,
    challenger: {
      username: d.challenger?.username || "?",
      avatar_url: d.challenger?.avatar_url || null,
      ovr: d.challenger_stats?.ovr || 0,
      tier: (d.challenger_stats?.tier || "bronze") as CardTier,
    },
    opponent: {
      username: d.opponent?.username || "?",
      avatar_url: d.opponent?.avatar_url || null,
      ovr: d.opponent_stats?.ovr || 0,
      tier: (d.opponent_stats?.tier || "bronze") as CardTier,
    },
    // Remove the embedded objects from the spread
    challenger_stats: undefined,
    opponent_stats: undefined,
    is_mine: d.challenger_id === userId,
  }));

  return { duels: enriched, user_id: userId };
}

export async function createDuel(challengerId: string, input: CreateDuelInput) {
  const { opponent_id, category, duel_type, stake } = input;

  if (opponent_id === challengerId) {
    throw new AppError("SELF_DUEL", "Tu ne peux pas te défier toi-même", 400);
  }

  // Check opponent exists
  const { data: opponent } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", opponent_id)
    .single();

  if (!opponent) {
    throw new AppError("OPPONENT_NOT_FOUND", "Adversaire introuvable", 404);
  }

  // Check no existing active duel between these two
  const { data: existingDuels } = await supabaseAdmin
    .from("duels")
    .select("id")
    .or(`and(challenger_id.eq.${challengerId},opponent_id.eq.${opponent_id}),and(challenger_id.eq.${opponent_id},opponent_id.eq.${challengerId})`)
    .in("status", ["pending", "accepted"])
    .limit(1);

  if (existingDuels && existingDuels.length > 0) {
    throw new AppError("DUEL_EXISTS", "Un duel actif existe déjà entre vous deux", 409);
  }

  const weekLabel = duel_type === "weekly" ? getCurrentWeekLabel() : null;

  const { data: duel, error } = await supabaseAdmin
    .from("duels")
    .insert({
      challenger_id: challengerId,
      opponent_id,
      category,
      duel_type: duel_type || "instant",
      stake: stake || 10,
      status: "pending",
      week_label: weekLabel,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return duel;
}

function getCurrentWeekLabel(): string {
  const now = new Date();
  const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
