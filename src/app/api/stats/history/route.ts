import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/stats/history
 * Returns the last 12 weeks of stats history for the current user.
 * Used for the progression chart on the profile page.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();

    if (!profile) {
      return Response.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Fetch last 12 weeks of history
    const { data: history, error } = await supabaseAdmin
      .from("stats_history")
      .select("week_label, pac, end, mon, res, spr, val, ovr, tier, special_card, weekly_km, weekly_dplus, weekly_rides")
      .eq("user_id", profile.id)
      .order("week_label", { ascending: false })
      .limit(12);

    if (error) throw error;

    return Response.json({
      history: (history || []).reverse(), // chronological order
    });
  } catch (err: any) {
    console.error("[STATS HISTORY] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
