import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { parsePagination, getPaginationRange, paginatedResponse } from "@/lib/pagination";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  const { from, to } = getPaginationRange(pagination);

  const { data: events, error, count } = await supabaseAdmin
    .from("activity_feed")
    .select("*, profiles!user_id(username, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return handleApiError(error, "FEED_GET");

  return Response.json(paginatedResponse(events || [], count ?? 0, pagination));
}
