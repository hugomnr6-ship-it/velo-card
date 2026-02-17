import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { insertFeedEvent } from "@/lib/feed";
import { z } from "zod";

const equipSkinSchema = z.object({
  skinId: z.string().min(1),
});

/**
 * POST /api/skins/equip — equip a skin the user owns
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

  const validated = validateBody(equipSkinSchema, body);
  if (validated instanceof Response) return validated;

  try {
    // Verify user owns this skin
    const { data: owned } = await supabaseAdmin
      .from("user_inventory")
      .select("id, pack_items!inner(effect)")
      .eq("user_id", auth.profileId)
      .eq("is_active", true)
      .limit(100);

    const hasSkin = (owned || []).some((inv: any) =>
      inv.pack_items?.effect?.skin_id === validated.skinId
    );

    if (!hasSkin) {
      // Check if it's a skin they own directly
      const { data: directSkin } = await supabaseAdmin
        .from("card_skins")
        .select("id")
        .eq("id", validated.skinId)
        .single();

      if (!directSkin) {
        return Response.json({ error: "Skin non possede" }, { status: 400 });
      }
    }

    // Unequip all current skins
    await supabaseAdmin
      .from("user_inventory")
      .update({ equipped: false })
      .eq("user_id", auth.profileId)
      .eq("equipped", true);

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ equipped_skin: validated.skinId })
      .eq("id", auth.profileId);

    insertFeedEvent(auth.profileId, "skin_equipped", {
      skinId: validated.skinId,
    });

    return Response.json({ success: true, equipped_skin: validated.skinId });
  } catch (err) {
    return handleApiError(err, "SKIN_EQUIP");
  }
}
