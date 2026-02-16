import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { raceId } = await params;
  if (!isValidUUID(raceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
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
    .insert({ race_id: raceId, user_id: profileId });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Tu participes déjà à cette course" },
        { status: 409 },
      );
    }
    return handleApiError(error, "RACE_JOIN");
  }

  return Response.json({ success: true }, { status: 201 });
}
