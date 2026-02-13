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
    .select("creator_id")
    .eq("id", clubId)
    .single();

  if (!club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  // Creator cannot leave
  if (club.creator_id === profile.id) {
    return Response.json(
      { error: "Le createur ne peut pas quitter le club" },
      { status: 400 },
    );
  }

  // Delete membership
  await supabaseAdmin
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", profile.id);

  return Response.json({ success: true });
}
