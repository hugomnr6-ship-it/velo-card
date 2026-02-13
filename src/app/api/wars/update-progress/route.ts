import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { updateWarProgressForUser } from "@/lib/wars";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();

    if (!profile) {
      return Response.json({ error: "Profil introuvable" }, { status: 404 });
    }

    await updateWarProgressForUser(profile.id);

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("War update error:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
