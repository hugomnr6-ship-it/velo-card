import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { invalidateCache } from "@/lib/cache";
import { handleApiError } from "@/lib/api-utils";

/**
 * POST /api/admin/purge-cache
 * One-shot : invalide tous les caches contenant des données d'autres users.
 * À exécuter après déploiement de la migration sharing_consent.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("strava_id", Number(session.user.id))
      .single();

    if (!profile?.is_admin) {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Invalider tous les caches contenant des données d'autres users
    const patterns = [
      "leaderboard:*",
      "feed:*",
      "totw:*",
      "duel:*",
      "club:*",
      "war:*",
      "profile:*",
      "stats:*",
    ];

    const results = await Promise.allSettled(
      patterns.map((p) => invalidateCache(p))
    );

    const purged = patterns.filter((_, i) => results[i].status === "fulfilled");
    const failed = patterns.filter((_, i) => results[i].status === "rejected");

    return Response.json({
      success: true,
      purged,
      failed,
      message: `Cache purgé : ${purged.length}/${patterns.length} patterns`,
    });
  } catch (err) {
    return handleApiError(err, "PURGE_CACHE");
  }
}
