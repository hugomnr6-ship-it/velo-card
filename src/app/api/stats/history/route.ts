import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/stats/history
 * Returns the last 12 weeks of stats history for the current user.
 * Used for the progression chart on the profile page.
 */
export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    // Fetch last 12 weeks of history
    const { data: history, error } = await supabaseAdmin
      .from("stats_history")
      .select("week_label, pac, end, mon, res, spr, val, ovr, tier, special_card, weekly_km, weekly_dplus, weekly_rides")
      .eq("user_id", profileId)
      .order("week_label", { ascending: false })
      .limit(12);

    if (error) throw error;

    return Response.json({
      history: (history || []).reverse(), // chronological order
    });
  } catch (err) {
    return handleApiError(err, "STATS_HISTORY");
  }
}
