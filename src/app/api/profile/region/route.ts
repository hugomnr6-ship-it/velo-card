import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { updateRegionSchema } from "@/schemas";

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const body = await request.json();
  const validated = validateBody(updateRegionSchema, body);
  if (validated instanceof Response) return validated;
  const { region } = validated;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ region })
    .eq("id", profileId);

  if (error) return handleApiError(error, "PROFILE_REGION");

  return Response.json({ success: true, region });
}
