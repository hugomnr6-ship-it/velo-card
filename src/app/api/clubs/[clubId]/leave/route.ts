import { getAuthenticatedUser, isErrorResponse, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { clubId } = await params;
  if (!isValidUUID(clubId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
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
  if (club.creator_id === profileId) {
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
    .eq("user_id", profileId);

  return Response.json({ success: true });
}
