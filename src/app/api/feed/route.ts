import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { parsePagination, getPaginationRange, paginatedResponse } from "@/lib/pagination";

/**
 * GET /api/feed
 * Feed social — filtre par consentement de partage.
 * Les events de l'user authentifié sont toujours visibles.
 * Les events d'autres users ne sont visibles que si sharing_consent = true.
 */
export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  const { from, to } = getPaginationRange(pagination);

  // Joindre les profils pour vérifier le consentement
  // On garde les events de l'user auth + ceux des users consentants
  const { data: events, error, count } = await supabaseAdmin
    .from("activity_feed")
    .select("*, profiles!user_id(username, avatar_url, sharing_consent)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return handleApiError(error, "FEED_GET");

  // Filtrer : garder ses propres events + events des users consentants
  const filteredEvents = (events || []).filter((event: any) =>
    event.user_id === profileId || event.profiles?.sharing_consent === true
  );

  // Nettoyer les métadonnées Strava brutes des events d'autres users
  const sanitizedEvents = filteredEvents.map((event: any) => {
    if (event.user_id === profileId) return event;

    // Retirer les données Strava brutes des metadata
    if (event.metadata) {
      const { distance, elevation, time, speed, weekly_km, weekly_dplus, finish_time, ...cleanMeta } = event.metadata;
      return { ...event, metadata: cleanMeta };
    }
    return event;
  });

  return Response.json(paginatedResponse(sanitizedEvents, count ?? 0, pagination));
}
