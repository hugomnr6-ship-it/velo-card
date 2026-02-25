import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/ghost/:claimToken
 * Retourne les infos d'une ghost card pour claim.
 * Auth obligatoire. Ne retourne pas gen_score (donnée dérivée).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ claimToken: string }> },
) {
  // Auth obligatoire
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { claimToken } = await params;

  // Fetch ghost profile
  const { data: ghost, error } = await supabaseAdmin
    .from("ghost_profiles")
    .select("id, rider_name, tier, claimed_by, race_id")
    .eq("claim_token", claimToken)
    .single();

  if (error || !ghost) {
    return Response.json({ error: "Fantôme introuvable" }, { status: 404 });
  }

  // Fetch race info
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("name, date")
    .eq("id", ghost.race_id)
    .single();

  return Response.json({
    rider_name: ghost.rider_name,
    tier: ghost.tier,
    race_name: race?.name || "Course inconnue",
    race_date: race?.date || null,
    is_claimed: !!ghost.claimed_by,
  });
}
