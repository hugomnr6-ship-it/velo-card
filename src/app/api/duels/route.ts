import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { getDuelsForUser, createDuel } from "@/services/duel.service";
import { createDuelSchema } from "@/schemas";
import { isUserPro } from "@/services/subscription.service";
import { supabaseAdmin } from "@/lib/supabase";
import { PRO_GATES } from "@/lib/pro-gates";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const filter = new URL(request.url).searchParams.get("filter") || "all";

  try {
    const data = await getDuelsForUser(auth.profileId, filter);
    return Response.json(data);
  } catch (err) {
    return handleApiError(err, "DUELS_GET");
  }
}

export async function POST(request: Request) {
  // Rate limiting is now handled globally by middleware (Upstash Redis)

  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const validated = validateBody(createDuelSchema, body);
  if (validated instanceof Response) return validated;

  try {
    // Gate Free/Pro : Free users limités à 1 duel actif
    const isPro = await isUserPro(auth.profileId);
    if (!isPro) {
      const { count } = await supabaseAdmin
        .from("duels")
        .select("id", { count: "exact", head: true })
        .or(`challenger_id.eq.${auth.profileId},opponent_id.eq.${auth.profileId}`)
        .in("status", ["pending", "accepted"]);

      if ((count || 0) >= PRO_GATES.duels.freeMaxActive) {
        return Response.json(
          { error: { code: "FREE_DUEL_LIMIT", message: "Les utilisateurs Free sont limités à 1 duel actif. Passe Pro pour des duels illimités !" }, upgradeUrl: "/pricing" },
          { status: 403 },
        );
      }
    }

    const duel = await createDuel(auth.profileId, validated);
    return Response.json({ duel });
  } catch (err) {
    return handleApiError(err, "DUELS_POST");
  }
}
