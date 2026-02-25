import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/users/search?q=username
 * Recherche d'utilisateurs par username (case-insensitive, partial match).
 * Auth obligatoire. Filtre par sharing_consent = true.
 * Retourne uniquement : user_id, username, avatar_url, region (pas de stats).
 */
export async function GET(request: Request) {
  // Auth obligatoire
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  let query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ error: "Minimum 2 caractères" }, { status: 400 });
  }

  // Sanitize for SQL LIKE wildcards
  query = query.replace(/[%_\\]/g, "");
  if (query.length < 2) {
    return Response.json({ error: "Minimum 2 caractères valides" }, { status: 400 });
  }

  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url, region")
      .eq("sharing_consent", true)
      .ilike("username", `%${query}%`)
      .limit(20);

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      return Response.json([]);
    }

    // Retourner uniquement les infos de base (pas de stats)
    const results = profiles.map((p) => ({
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      region: p.region || null,
    }));

    return Response.json(results);
  } catch (err) {
    return handleApiError(err, "USERS_SEARCH");
  }
}
