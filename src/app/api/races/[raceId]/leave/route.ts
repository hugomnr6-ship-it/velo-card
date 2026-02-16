import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
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

  if (race?.creator_id === profileId) {
    return Response.json(
      { error: "Le créateur ne peut pas se désinscrire" },
      { status: 400 },
    );
  }

  await supabaseAdmin
    .from("race_entries")
    .delete()
    .eq("race_id", raceId)
    .eq("user_id", profileId);

  return Response.json({ success: true });
}
