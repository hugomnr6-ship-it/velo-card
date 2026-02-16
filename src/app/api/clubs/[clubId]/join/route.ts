import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
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
    .select("id, name, logo_url")
    .eq("id", clubId)
    .single();

  if (!club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  // Insert membership
  const { error } = await supabaseAdmin
    .from("club_members")
    .insert({ club_id: clubId, user_id: profileId });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Tu es deja membre de ce club" },
        { status: 409 },
      );
    }
    return handleApiError(error, "CLUBS_JOIN_POST");
  }

  return Response.json({ success: true }, { status: 201 });
}
