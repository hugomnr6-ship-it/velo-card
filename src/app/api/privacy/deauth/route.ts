import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

/**
 * POST /api/privacy/deauth — Déconnexion Strava + nettoyage des données
 */
export async function POST() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    // 1. Appeler la fonction SQL de nettoyage
    const { error: cleanupError } = await supabaseAdmin
      .rpc("cleanup_strava_data", { p_user_id: profileId });

    if (cleanupError) {
      logger.error("[DEAUTH] cleanup_strava_data failed", { error: cleanupError.message });
      throw cleanupError;
    }

    // 2. Révoquer le token Strava via l'API Strava
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("strava_id")
        .eq("id", profileId)
        .single();

      if (profile?.strava_id) {
        // Récupérer le token d'accès depuis la table accounts (NextAuth)
        const { data: account } = await supabaseAdmin
          .from("accounts")
          .select("access_token")
          .eq("provider", "strava")
          .eq("provider_account_id", String(profile.strava_id))
          .single();

        if (account?.access_token) {
          const revokeRes = await fetch("https://www.strava.com/oauth/deauthorize", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `access_token=${account.access_token}`,
          });

          if (!revokeRes.ok) {
            logger.warn("[DEAUTH] Strava deauthorize failed", { status: revokeRes.status });
          }
        }
      }
    } catch (stravaErr) {
      // Ne pas bloquer la déconnexion si l'appel Strava échoue
      logger.warn("[DEAUTH] Strava revocation failed, continuing", { error: String(stravaErr) });
    }

    // 3. Invalider tout le cache Redis pour cet user
    await Promise.all([
      invalidateCache(`profile:${profileId}`),
      invalidateCache(`stats:${profileId}`),
      invalidateCache("leaderboard:*"),
      invalidateCache("feed:*"),
      invalidateCache("totw:*"),
      invalidateCache("duel:*"),
      invalidateCache("club:*"),
    ]);

    return Response.json({
      success: true,
      message: "Données Strava supprimées",
    });
  } catch (err) {
    return handleApiError(err, "DEAUTH_POST");
  }
}
