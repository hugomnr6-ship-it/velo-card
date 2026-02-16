import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  // Look up profile by UUID first (reliable), fall back to strava_id
  let profile: { id: string } | null = null;
  if (session.user.id) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();
    profile = data;
  }
  if (!profile && session.user.stravaId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();
    profile = data;
  }

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Use upsert to handle case where user_stats row doesn't exist yet
  await supabaseAdmin
    .from("user_stats")
    .upsert(
      {
        user_id: profile.id,
        has_onboarded: true,
      },
      { onConflict: "user_id" },
    );

  return Response.json({ ok: true });
}
