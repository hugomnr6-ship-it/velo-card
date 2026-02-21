import { supabaseAdmin } from "@/lib/supabase";
import { addCoins } from "./coins.service";
import { addSeasonPoints, SEASON_POINTS } from "./seasons.service";
import { insertFeedEvent } from "@/lib/feed";

/**
 * Assign daily quests to a user (3 random dailies).
 * Idempotent: skips if already assigned today.
 */
export async function assignDailyQuests(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Check if already assigned today
  const { data: existing } = await supabaseAdmin
    .from("user_quests")
    .select("id")
    .eq("user_id", userId)
    .eq("assigned_date", today)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Get active daily quests
  const { data: dailies } = await supabaseAdmin
    .from("quest_definitions")
    .select("*")
    .eq("quest_type", "daily")
    .eq("is_active", true);

  if (!dailies || dailies.length === 0) return;

  // Select 3 random quests
  const shuffled = dailies.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(3, shuffled.length));

  await supabaseAdmin.from("user_quests").insert(
    selected.map((q) => ({
      user_id: userId,
      quest_id: q.id,
      assigned_date: today,
      current_value: 0,
      is_completed: false,
    }))
  );
}

/**
 * Assign weekly quests (2 random weeklies).
 * Called by the Monday cron.
 */
export async function assignWeeklyQuests(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const { data: weeklies } = await supabaseAdmin
    .from("quest_definitions")
    .select("*")
    .eq("quest_type", "weekly")
    .eq("is_active", true);

  if (!weeklies || weeklies.length === 0) return;

  const shuffled = weeklies.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(2, shuffled.length));

  for (const q of selected) {
    await supabaseAdmin.from("user_quests").upsert({
      user_id: userId,
      quest_id: q.id,
      assigned_date: today,
      current_value: 0,
      is_completed: false,
    }, { onConflict: "user_id,quest_id,assigned_date" });
  }
}

/**
 * Update quest progress after a Strava sync.
 * Returns list of newly completed quest IDs.
 */
export async function updateQuestProgress(
  userId: string,
  todayKm: number,
  todayDplus: number,
  todayRides: number,
  weeklyKm: number,
  weeklyDplus: number,
  weeklyRides: number,
): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];
  const completedQuests: string[] = [];

  // Get the start of the current week (Monday)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().split("T")[0];

  // Fetch active quests (daily for today + weekly for this week)
  const { data: activeQuests } = await supabaseAdmin
    .from("user_quests")
    .select("*, quest_definitions(*)")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .gte("assigned_date", mondayStr);

  if (!activeQuests) return [];

  for (const uq of activeQuests) {
    const def = (uq as any).quest_definitions;
    if (!def) continue;

    let currentValue = 0;
    const isDaily = def.quest_type === "daily";

    switch (def.target_metric) {
      case "km":
        currentValue = isDaily ? todayKm : weeklyKm;
        break;
      case "dplus":
        currentValue = isDaily ? todayDplus : weeklyDplus;
        break;
      case "rides":
        currentValue = isDaily ? todayRides : weeklyRides;
        break;
      // duels_won handled separately
    }

    const isNowComplete = currentValue >= def.target_value;

    // Update progress
    await supabaseAdmin
      .from("user_quests")
      .update({
        current_value: Math.round(currentValue * 10) / 10,
        is_completed: isNowComplete,
        completed_at: isNowComplete ? new Date().toISOString() : null,
      })
      .eq("id", uq.id);

    // If newly completed → reward
    if (isNowComplete && !uq.is_completed) {
      await addCoins(userId, def.coin_reward, "quest_complete", {
        questId: def.id,
        questTitle: def.title,
      });

      await supabaseAdmin
        .from("user_quests")
        .update({ coin_claimed: true })
        .eq("id", uq.id);

      insertFeedEvent(userId, "quest_completed", {
        questId: def.id,
        questTitle: def.title,
        coinReward: def.coin_reward,
      });

      // Season points for quest completion
      await addSeasonPoints(userId, SEASON_POINTS.quest_complete, "quests_completed", 1);

      completedQuests.push(def.id);
    }
  }

  return completedQuests;
}

/**
 * Enregistre un événement contextuel pour les quêtes (visite page, action...).
 * Appelé depuis les API routes quand l'utilisateur effectue une action trackée.
 */
export async function trackQuestEvent(
  userId: string,
  metric: string,
): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];
  const completedQuests: string[] = [];

  // Début de la semaine (lundi)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().split("T")[0];

  // Chercher les quêtes actives qui correspondent à cette metric
  const { data: activeQuests } = await supabaseAdmin
    .from("user_quests")
    .select("*, quest_definitions(*)")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .gte("assigned_date", mondayStr);

  if (!activeQuests) return [];

  for (const uq of activeQuests) {
    const def = (uq as any).quest_definitions;
    if (!def || def.target_metric !== metric) continue;

    const newValue = uq.current_value + 1;
    const isNowComplete = newValue >= def.target_value;

    await supabaseAdmin
      .from("user_quests")
      .update({
        current_value: newValue,
        is_completed: isNowComplete,
        completed_at: isNowComplete ? new Date().toISOString() : null,
      })
      .eq("id", uq.id);

    if (isNowComplete) {
      await addCoins(userId, def.coin_reward, "quest_complete", {
        questId: def.id,
        questTitle: def.title,
      });

      await supabaseAdmin
        .from("user_quests")
        .update({ coin_claimed: true })
        .eq("id", uq.id);

      insertFeedEvent(userId, "quest_completed", {
        questId: def.id,
        questTitle: def.title,
        coinReward: def.coin_reward,
      });

      await addSeasonPoints(userId, SEASON_POINTS.quest_complete, "quests_completed", 1);
      completedQuests.push(def.id);
    }
  }

  return completedQuests;
}

/**
 * Get a user's active quests (daily + weekly) with progress.
 */
export async function getUserQuests(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Get start of current week
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().split("T")[0];

  const { data } = await supabaseAdmin
    .from("user_quests")
    .select("*, quest_definitions(*)")
    .eq("user_id", userId)
    .gte("assigned_date", mondayStr)
    .order("created_at", { ascending: true });

  return (data || []).map((uq: any) => ({
    id: uq.id,
    quest_id: uq.quest_id,
    quest: uq.quest_definitions,
    current_value: uq.current_value,
    target_value: uq.quest_definitions?.target_value,
    is_completed: uq.is_completed,
    completed_at: uq.completed_at,
    coin_claimed: uq.coin_claimed,
    assigned_date: uq.assigned_date,
  }));
}
