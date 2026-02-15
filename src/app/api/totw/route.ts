import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/totw?week=2026-W07
 * Returns the Team of the Week for a given week (defaults to current week).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekLabel = searchParams.get("week") || getCurrentWeekLabel();

  try {
    // Fetch TOTW entries with user info
    const { data: totwEntries, error } = await supabaseAdmin
      .from("team_of_the_week")
      .select(`
        week_label,
        category,
        stat_value,
        user_id,
        profiles!inner(username, avatar_url),
        user_stats!inner(ovr, tier, pac, mon, spr, end, res, val)
      `)
      .eq("week_label", weekLabel);

    if (error) throw error;

    const formatted = (totwEntries || []).map((entry: any) => ({
      week_label: entry.week_label,
      category: entry.category,
      stat_value: entry.stat_value,
      user_id: entry.user_id,
      username: entry.profiles.username,
      avatar_url: entry.profiles.avatar_url,
      tier: entry.user_stats.tier,
      ovr: entry.user_stats.ovr,
      stats: {
        pac: entry.user_stats.pac,
        mon: entry.user_stats.mon,
        spr: entry.user_stats.spr,
        end: entry.user_stats.end,
        res: entry.user_stats.res,
        val: entry.user_stats.val,
        ovr: entry.user_stats.ovr,
      },
    }));

    return Response.json({
      week: weekLabel,
      team: formatted,
    });
  } catch (err: any) {
    console.error("[TOTW] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
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
