import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { stravaId } = authResult;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, strava_id, username, avatar_url, region, created_at")
    .eq("strava_id", stravaId)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  return Response.json(profile);
}
