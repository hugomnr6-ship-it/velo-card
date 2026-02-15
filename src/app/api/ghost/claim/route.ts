import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { claimToken } = body;

  if (!claimToken) {
    return Response.json({ error: "Token manquant" }, { status: 400 });
  }

  // Get current user profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Find ghost by claim token (must be unclaimed)
  const { data: ghost, error } = await supabaseAdmin
    .from("ghost_profiles")
    .select("id, race_id")
    .eq("claim_token", claimToken)
    .is("claimed_by", null)
    .single();

  if (error || !ghost) {
    return Response.json(
      { error: "Ce fantôme a déjà été réclamé ou n'existe pas" },
      { status: 404 },
    );
  }

  // Claim the ghost
  const { error: updateError } = await supabaseAdmin
    .from("ghost_profiles")
    .update({ claimed_by: profile.id })
    .eq("id", ghost.id);

  if (updateError) {
    return Response.json({ error: "Erreur lors de la réclamation" }, { status: 500 });
  }

  // Update race_results to link to real user
  await supabaseAdmin
    .from("race_results")
    .update({ user_id: profile.id })
    .eq("ghost_id", ghost.id);

  return Response.json({ success: true, race_id: ghost.race_id });
}
