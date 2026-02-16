import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { region } = await request.json();

  if (region !== null && typeof region !== "string") {
    return Response.json({ error: "Région invalide" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ region })
    .eq("id", profileId);

  if (error) return handleApiError(error, "PROFILE_REGION");

  return Response.json({ success: true, region });
}
