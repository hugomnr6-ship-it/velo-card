import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUser();
    if (isErrorResponse(authResult)) return authResult;

    const subscription = await req.json();
    const { endpoint, keys } = subscription;

    await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: authResult.profileId,
        endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      },
      { onConflict: "user_id,endpoint" },
    );

    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err, "PUSH_SUBSCRIBE");
  }
}
