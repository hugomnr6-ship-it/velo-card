import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  // Rate limiting is now handled globally by middleware (Upstash Redis)

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;
  const { profileId } = auth;

  try {
    const body = await request.json();
    const { claimToken } = body;

    if (!claimToken || typeof claimToken !== "string") {
      return Response.json({ error: "Token manquant" }, { status: 400 });
    }

    // Valider le format du token (alphanumeric, 6-20 chars)
    if (!/^[a-zA-Z0-9]{6,20}$/.test(claimToken)) {
      return Response.json({ error: "Format de token invalide" }, { status: 400 });
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

    // Claim the ghost — atomic avec WHERE claimed_by IS NULL
    const { data: claimed, error: updateError } = await supabaseAdmin
      .from("ghost_profiles")
      .update({ claimed_by: profileId })
      .eq("id", ghost.id)
      .is("claimed_by", null)
      .select("id")
      .single();

    if (updateError || !claimed) {
      return Response.json(
        { error: "Ce fantôme vient d'être réclamé par quelqu'un d'autre" },
        { status: 409 },
      );
    }

    // Update race_results to link to real user
    await supabaseAdmin
      .from("race_results")
      .update({ user_id: profileId })
      .eq("ghost_id", ghost.id);

    return Response.json({ success: true, race_id: ghost.race_id });
  } catch (err) {
    return handleApiError(err, "GHOST_CLAIM");
  }
}
