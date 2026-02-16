import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { clubId } = await params;

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
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
