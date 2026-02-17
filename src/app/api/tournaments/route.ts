import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/tournaments — list tournaments
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const { data } = await supabaseAdmin
      .from("tournaments")
      .select("id, name, description, tournament_type, category, max_participants, entry_cost_coins, prize_pool_coins, status, starts_at, registration_ends_at")
      .in("status", ["registration", "active"])
      .order("starts_at", { ascending: true });

    // Add participant counts
    const enriched = await Promise.all(
      (data || []).map(async (t: any) => {
        const { count } = await supabaseAdmin
          .from("tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("tournament_id", t.id);
        return { ...t, participants_count: count || 0 };
      })
    );

    return Response.json(enriched);
  } catch (err) {
    return handleApiError(err, "TOURNAMENTS_LIST");
  }
}
