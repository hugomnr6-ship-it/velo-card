import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUser();
    if (isErrorResponse(authResult)) return authResult;

    const { endpoint } = await req.json();

    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", authResult.profileId)
      .eq("endpoint", endpoint);

    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err, "PUSH_UNSUBSCRIBE");
  }
}
