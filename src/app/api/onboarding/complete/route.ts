import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

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
