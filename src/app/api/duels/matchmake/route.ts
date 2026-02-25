import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import { matchmakeSchema } from "@/schemas";

/**
 * POST /api/duels/matchmake — matchmaking automatique
 * Filtre par sharing_consent = true. Ne retourne pas opponent_ovr.
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const validated = validateBody(matchmakeSchema, body);
  if (validated instanceof Response) return validated;

  try {
    // Get user's OVR
    const { data: userStats } = await supabaseAdmin
      .from("user_stats")
      .select("ovr")
      .eq("user_id", auth.profileId)
      .single();

    const userOvr = userStats?.ovr || 0;

    // Clean up old entries (> 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("matchmaking_queue")
      .delete()
      .lt("created_at", oneDayAgo);

    // Chercher un match : même catégorie, OVR ±15, même mise, pas soi-même
    // Joindre les profils pour vérifier le consentement
    const { data: matches } = await supabaseAdmin
      .from("matchmaking_queue")
      .select("*, profiles!user_id(sharing_consent)")
      .eq("category", validated.category)
      .eq("stake", validated.stake)
      .neq("user_id", auth.profileId)
      .gte("user_ovr", userOvr - 15)
      .lte("user_ovr", userOvr + 15)
      .order("created_at", { ascending: true })
      .limit(10);

    // Filtrer par consentement
    const match = (matches || []).find((m: any) => m.profiles?.sharing_consent === true);

    if (match) {
      // Match trouvé ! Créer le duel et retirer de la queue
      await supabaseAdmin
        .from("matchmaking_queue")
        .delete()
        .eq("id", match.id);

      // Retirer soi-même de la queue si présent
      await supabaseAdmin
        .from("matchmaking_queue")
        .delete()
        .eq("user_id", auth.profileId)
        .eq("category", validated.category);

      // Créer le duel (instant type)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data: duel, error: duelError } = await supabaseAdmin
        .from("duels")
        .insert({
          challenger_id: match.user_id,
          opponent_id: auth.profileId,
          category: validated.category,
          duel_type: "instant",
          stake: validated.stake,
          status: "pending",
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (duelError) throw duelError;

      // Notifier les deux joueurs
      insertFeedEvent(match.user_id, "matchmake_found", {
        duelId: duel!.id,
        opponentName: auth.session.user.name || "Cycliste",
      });

      // Ne pas retourner opponent_ovr — les stats sont visibles dans le duel
      return Response.json({
        matched: true,
        duelId: duel!.id,
      });
    } else {
      // Pas de match — ajouter à la queue
      await supabaseAdmin.from("matchmaking_queue").upsert({
        user_id: auth.profileId,
        category: validated.category,
        stake: validated.stake,
        user_ovr: userOvr,
      }, { onConflict: "user_id,category" });

      // Position dans la queue
      const { count } = await supabaseAdmin
        .from("matchmaking_queue")
        .select("id", { count: "exact", head: true })
        .eq("category", validated.category);

      return Response.json({
        matched: false,
        queued: true,
        position: count || 1,
      });
    }
  } catch (err) {
    return handleApiError(err, "MATCHMAKE");
  }
}
