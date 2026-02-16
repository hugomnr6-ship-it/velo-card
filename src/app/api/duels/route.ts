import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createDuelSchema } from "@/schemas";
import type { CardTier } from "@/types";

/**
 * GET /api/duels — List duels for current user (pending, active, recent resolved)
 * POST /api/duels — Create a new duel challenge
 */

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const userId = profileId;
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // all, pending, active, history

  // Build query
  let query = supabaseAdmin
    .from("duels")
    .select("*")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter === "pending") {
    query = query.eq("status", "pending");
  } else if (filter === "active") {
    query = query.eq("status", "accepted");
  } else if (filter === "history") {
    query = query.in("status", ["resolved", "declined", "expired"]);
  }

  const { data: duels, error } = await query;
  if (error) return handleApiError(error, "DUELS_GET");

  // Enrich with player info
  const allUserIds = new Set<string>();
  for (const d of duels || []) {
    allUserIds.add(d.challenger_id);
    allUserIds.add(d.opponent_id);
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", Array.from(allUserIds));

  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, ovr, tier")
    .in("user_id", Array.from(allUserIds));

  const profileMap: Record<string, any> = {};
  for (const p of profiles || []) profileMap[p.id] = p;

  const statsMap: Record<string, any> = {};
  for (const s of stats || []) statsMap[s.user_id] = s;

  const enriched = (duels || []).map((d) => ({
    ...d,
    challenger: {
      username: profileMap[d.challenger_id]?.username || "?",
      avatar_url: profileMap[d.challenger_id]?.avatar_url || null,
      ovr: statsMap[d.challenger_id]?.ovr || 0,
      tier: (statsMap[d.challenger_id]?.tier || "bronze") as CardTier,
    },
    opponent: {
      username: profileMap[d.opponent_id]?.username || "?",
      avatar_url: profileMap[d.opponent_id]?.avatar_url || null,
      ovr: statsMap[d.opponent_id]?.ovr || 0,
      tier: (statsMap[d.opponent_id]?.tier || "bronze") as CardTier,
    },
    is_mine: d.challenger_id === userId,
  }));

  return Response.json({ duels: enriched, user_id: userId });
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const body = await request.json();
  const validated = validateBody(createDuelSchema, body);
  if (validated instanceof Response) return validated;
  const { opponent_id, category, duel_type, stake } = validated;

  if (opponent_id === profileId) {
    return Response.json({ error: { code: "SELF_DUEL", message: "Tu ne peux pas te défier toi-même" } }, { status: 400 });
  }

  // Check opponent exists
  const { data: opponent } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", opponent_id)
    .single();

  if (!opponent) {
    return Response.json({ error: "Adversaire introuvable" }, { status: 404 });
  }

  // Check no existing active duel between these two
  const { data: existingDuels } = await supabaseAdmin
    .from("duels")
    .select("id")
    .or(`and(challenger_id.eq.${profileId},opponent_id.eq.${opponent_id}),and(challenger_id.eq.${opponent_id},opponent_id.eq.${profileId})`)
    .in("status", ["pending", "accepted"])
    .limit(1);

  if (existingDuels && existingDuels.length > 0) {
    return Response.json({ error: "Un duel actif existe déjà entre vous deux" }, { status: 409 });
  }

  // For instant duels, resolve immediately on acceptance
  // For weekly duels, set the current week label
  const weekLabel = duel_type === "weekly" ? getCurrentWeekLabel() : null;

  const { data: duel, error } = await supabaseAdmin
    .from("duels")
    .insert({
      challenger_id: profileId,
      opponent_id,
      category,
      duel_type: duel_type || "instant",
      stake: stake || 10,
      status: "pending",
      week_label: weekLabel,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) return handleApiError(error, "DUELS_POST");

  return Response.json({ duel });
}

function getCurrentWeekLabel(): string {
  const now = new Date();
  const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
