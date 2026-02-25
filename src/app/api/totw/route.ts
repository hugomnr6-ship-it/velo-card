import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { cached } from "@/lib/cache";

// NOTE: Ne PAS utiliser Edge Runtime ici — api-utils importe next-auth qui nécessite Node.js
export const runtime = "nodejs";

/**
 * GET /api/totw?week=2026-W07
 * Returns the Team of the Week for a given week (defaults to current week).
 * Auth obligatoire. Filtre par sharing_consent = true. Ne retourne pas stat_value.
 */
export async function GET(request: Request) {
  // Auth obligatoire
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const weekLabel = searchParams.get("week") || getCurrentWeekLabel();

  try {
    // Cache Redis 2 heures (change 1x par semaine)
    const result = await cached(
      weekLabel,
      async () => {
        const { data: totwEntries, error } = await supabaseAdmin
          .from("team_of_the_week")
          .select(`
            week_label,
            category,
            user_id,
            profiles!inner(username, avatar_url, sharing_consent),
            user_stats!inner(ovr, tier)
          `)
          .eq("week_label", weekLabel);

        if (error) throw error;

        // Filtrer par consentement — ne pas exposer les users non consentants
        return (totwEntries || [])
          .filter((entry: any) => entry.profiles.sharing_consent === true)
          .map((entry: any) => ({
            week_label: entry.week_label,
            category: entry.category,
            user_id: entry.user_id,
            username: entry.profiles.username,
            avatar_url: entry.profiles.avatar_url,
            tier: entry.user_stats.tier,
            ovr: entry.user_stats.ovr,
          }));
      },
      { ttl: 7200, prefix: "totw" }
    );

    return Response.json({
      week: weekLabel,
      team: result,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    return handleApiError(err, "TOTW_GET");
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
