import { handleApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase";
import { assignDailyQuests } from "@/services/quests.service";

export const maxDuration = 120; // 2 minutes max

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/daily-reset
 * Cron Vercel déclenché chaque jour à minuit (UTC+1).
 * - Assigne de nouvelles quêtes daily à tous les utilisateurs actifs.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn("Daily Reset: unauthorized access attempt");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timer = logger.time("Daily Reset CRON");

    // Récupérer les utilisateurs actifs (connectés dans les 30 derniers jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabaseAdmin
      .from("user_stats")
      .select("user_id")
      .gte("last_synced_at", thirtyDaysAgo);

    if (!activeUsers || activeUsers.length === 0) {
      timer.end({ usersProcessed: 0 });
      return Response.json({ usersProcessed: 0 });
    }

    let assigned = 0;
    let errors = 0;

    for (const user of activeUsers) {
      try {
        await assignDailyQuests(user.user_id);
        assigned++;
      } catch {
        errors++;
      }
    }

    const duration = timer.end({ assigned, errors, total: activeUsers.length });

    return Response.json({
      usersProcessed: activeUsers.length,
      assigned,
      errors,
      durationMs: duration,
    });
  } catch (err) {
    logger.error("Daily Reset CRON failed", { error: String(err) });
    return handleApiError(err, "DAILY_RESET");
  }
}
