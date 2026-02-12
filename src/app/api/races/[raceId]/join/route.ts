import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const { data: race } = await supabaseAdmin
    .from("races")
    .select("id")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("race_entries")
    .insert({ race_id: raceId, user_id: profile.id });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Tu participes déjà à cette course" },
        { status: 409 },
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
