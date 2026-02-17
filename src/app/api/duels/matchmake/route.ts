import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import { z } from "zod";

const matchmakeSchema = z.object({
  category: z.enum(["ovr", "pac", "mon", "val", "spr", "end", "res", "weekly_km", "weekly_dplus", "weekly_rides"]),
  stake: z.number().int().min(5).max(50),
});

/**
 * POST /api/duels/matchmake — automatic matchmaking
 * Finds a compatible opponent or queues the user.
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

    // Look for a match: same category, OVR within ±15, same stake, not self
    const { data: match } = await supabaseAdmin
      .from("matchmaking_queue")
      .select("*")
      .eq("category", validated.category)
      .eq("stake", validated.stake)
      .neq("user_id", auth.profileId)
      .gte("user_ovr", userOvr - 15)
      .lte("user_ovr", userOvr + 15)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (match) {
      // Found a match! Create a duel and remove from queue
      await supabaseAdmin
        .from("matchmaking_queue")
        .delete()
        .eq("id", match.id);

      // Remove self from queue if present
      await supabaseAdmin
        .from("matchmaking_queue")
        .delete()
        .eq("user_id", auth.profileId)
        .eq("category", validated.category);

      // Create the duel (instant type)
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

      // Notify both players
      insertFeedEvent(match.user_id, "matchmake_found", {
        duelId: duel!.id,
        opponentName: auth.session.user.name || "Cycliste",
      });

      return Response.json({
        matched: true,
        duelId: duel!.id,
        opponent_ovr: match.user_ovr,
      });
    } else {
      // No match found — add to queue
      await supabaseAdmin.from("matchmaking_queue").upsert({
        user_id: auth.profileId,
        category: validated.category,
        stake: validated.stake,
        user_ovr: userOvr,
      }, { onConflict: "user_id,category" });

      // Count queue position
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
