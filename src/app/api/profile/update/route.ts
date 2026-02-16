import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { updateProfileSchema } from "@/schemas";

export async function PATCH(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const body = await request.json();
  const validated = validateBody(updateProfileSchema, body);
  if (validated instanceof Response) return validated;

  const updates: Record<string, string> = {};

  if (validated.bio !== undefined) {
    updates.bio = validated.bio.trim().slice(0, 160);
  }
  if (validated.favorite_climb !== undefined) {
    updates.favorite_climb = validated.favorite_climb.trim().slice(0, 100);
  }
  if (validated.bike_name !== undefined) {
    updates.bike_name = validated.bike_name.trim().slice(0, 80);
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Rien a modifier" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (error) return handleApiError(error, "PROFILE_UPDATE");

  return Response.json({ ok: true });
}
