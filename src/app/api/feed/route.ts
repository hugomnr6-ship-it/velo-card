import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: events, error } = await supabaseAdmin
    .from("activity_feed")
    .select("*, profiles!user_id(username, avatar_url)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleApiError(error, "FEED_GET");

  return Response.json(events || []);
}
