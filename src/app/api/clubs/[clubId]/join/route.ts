import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { clubId } = await params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, name, logo_url")
    .eq("id", clubId)
    .single();

  if (!club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  // Insert membership
  const { error } = await supabaseAdmin
    .from("club_members")
    .insert({ club_id: clubId, user_id: profile.id });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Tu es deja membre de ce club" },
        { status: 409 },
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
