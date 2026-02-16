import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");

  let userId = targetUserId;

  // If no userId provided, use own profile
  if (!userId) {
    userId = profileId;
  }

  const { data: badges, error } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(badges || []);
}
