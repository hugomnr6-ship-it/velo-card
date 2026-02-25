import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { hasConsent, sanitizePublicProfile } from "@/lib/privacy";

/**
 * GET /api/compare?user1=xxx&user2=xxx
 * Comparaison côte à côte de deux profils.
 * Auth obligatoire. Vérifie le consentement pour les profils d'autres users.
 * Retourne uniquement des stats abstraites (pas de données Strava brutes).
 */
export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return Response.json({ error: "user1 et user2 requis" }, { status: 400 });
  }

  try {
    // Vérifier le consentement pour chaque user qui n'est pas l'authentifié
    for (const uid of [user1, user2]) {
      if (uid !== profileId) {
        const consent = await hasConsent(uid);
        if (!consent) {
          return Response.json(
            { error: { code: "CONSENT_REQUIRED", message: "Cet utilisateur n'a pas activé le partage de ses stats" } },
            { status: 403 }
          );
        }
      }
    }

    const [profilesRes, statsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, avatar_url, region, club_name")
        .in("id", [user1, user2]),
      supabaseAdmin
        .from("user_stats")
        .select("user_id, pac, end, mon, res, spr, val, ovr, tier, special_card, active_weeks_streak")
        .in("user_id", [user1, user2]),
    ]);

    const profiles = profilesRes.data || [];
    const stats = statsRes.data || [];

    const profileMap: Record<string, any> = {};
    for (const p of profiles) profileMap[p.id] = p;

    const statsMap: Record<string, any> = {};
    for (const s of stats) statsMap[s.user_id] = s;

    // Construire le profil — sanitisé pour les autres users
    const buildUser = (userId: string) => {
      const p = profileMap[userId];
      const s = statsMap[userId];
      const merged = {
        id: userId,
        username: p?.username || "Inconnu",
        avatar_url: p?.avatar_url || null,
        region: p?.region || null,
        club_name: p?.club_name || null,
        pac: s?.pac || 0,
        end: s?.end || 0,
        mon: s?.mon || 0,
        res: s?.res || 0,
        spr: s?.spr || 0,
        val: s?.val || 0,
        ovr: s?.ovr || 0,
        tier: s?.tier || "bronze",
        special_card: s?.special_card || null,
        active_weeks_streak: s?.active_weeks_streak || 0,
      };

      // Pour l'autre user, toujours sanitiser
      if (userId !== profileId) {
        return sanitizePublicProfile(merged);
      }
      return { user_id: userId, ...merged };
    };

    return Response.json({
      user1: buildUser(user1),
      user2: buildUser(user2),
    });
  } catch (err) {
    return handleApiError(err, "COMPARE_GET");
  }
}
