import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { buySkin } from "@/services/shop.service";
import { checkBadges } from "@/lib/checkBadges";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const buySchema = z.object({
  shopItemId: z.string().min(1),
});

/**
 * POST /api/shop/buy — buy a skin from the current rotation
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

  const validated = validateBody(buySchema, body);
  if (validated instanceof Response) return validated;

  try {
    const result = await buySkin(auth.profileId, validated.shopItemId);

    // Trigger badge check — fire-and-forget
    supabaseAdmin
      .from("user_stats")
      .select("pac, end, mon, res, spr, val, ovr, tier, active_weeks_streak")
      .eq("user_id", auth.profileId)
      .single()
      .then(({ data: st }) => {
        if (st) {
          checkBadges({
            userId: auth.profileId,
            stats: { pac: st.pac, end: st.end, mon: st.mon, res: st.res, spr: st.spr, val: st.val, ovr: st.ovr },
            tier: st.tier,
            streak: st.active_weeks_streak || 0,
          }).catch(() => {});
        }
      });

    return Response.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Solde insuffisant") {
      return Response.json({ error: "Solde insuffisant" }, { status: 400 });
    }
    return handleApiError(err, "SHOP_BUY");
  }
}
