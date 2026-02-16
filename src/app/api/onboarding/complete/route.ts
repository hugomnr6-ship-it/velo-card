import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  // Use upsert to handle case where user_stats row doesn't exist yet
  await supabaseAdmin
    .from("user_stats")
    .upsert(
      {
        user_id: profileId,
        has_onboarded: true,
      },
      { onConflict: "user_id" },
    );

  return Response.json({ ok: true });
}
