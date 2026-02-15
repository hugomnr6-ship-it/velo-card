import { supabaseAdmin } from "@/lib/supabase";

// Public endpoint — no auth required
export async function GET(
  request: Request,
  { params }: { params: Promise<{ claimToken: string }> },
) {
  const { claimToken } = await params;

  // Fetch ghost profile
  const { data: ghost, error } = await supabaseAdmin
    .from("ghost_profiles")
    .select("id, rider_name, gen_score, tier, claimed_by, race_id")
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

  // Fetch result info (position + time)
  const { data: result } = await supabaseAdmin
    .from("race_results")
    .select("position, finish_time")
    .eq("ghost_id", ghost.id)
    .single();

  return Response.json({
    rider_name: ghost.rider_name,
    gen_score: ghost.gen_score,
    tier: ghost.tier,
    race_name: race?.name || "Course inconnue",
    race_date: race?.date || null,
    position: result?.position || null,
    finish_time: result?.finish_time || null,
    is_claimed: !!ghost.claimed_by,
    claimed_by: ghost.claimed_by,
  });
}
