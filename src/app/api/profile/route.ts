import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, strava_id, username, avatar_url, region, created_at")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  return Response.json(profile);
}
