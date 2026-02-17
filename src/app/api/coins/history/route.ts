import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/coins/history — returns recent coin transactions (paginated)
 */
export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const params = new URL(request.url).searchParams;
  const limit = Math.min(Number(params.get("limit")) || 50, 100);
  const offset = Math.max(Number(params.get("offset")) || 0, 0);

  try {
    const { data, error } = await supabaseAdmin
      .from("coin_transactions")
      .select("id, amount, reason, metadata, created_at")
      .eq("user_id", auth.profileId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return Response.json(data || []);
  } catch (err) {
    return handleApiError(err, "COINS_HISTORY");
  }
}
