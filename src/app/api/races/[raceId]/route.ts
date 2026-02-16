import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { getRaceDetail } from "@/services/race.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const { raceId } = await params;

  try {
    const data = await getRaceDetail(raceId, auth.profileId);
    return Response.json(data);
  } catch (err) {
    return handleApiError(err, "RACE_DETAIL_GET");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { raceId } = await params;

  const { data: race } = await supabaseAdmin
    .from("races")
    .select("creator_id")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  if (race.creator_id !== profileId) {
    return Response.json(
      { error: "Seul le créateur peut supprimer cette course" },
      { status: 403 },
    );
  }

  await supabaseAdmin.from("races").delete().eq("id", raceId);
  return Response.json({ success: true });
}
