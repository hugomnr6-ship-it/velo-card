import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const showcaseBadgesSchema = z.object({
  badgeIds: z.array(z.string()).max(3),
});

/**
 * POST /api/badges/showcase — set up to 3 featured badges on profile
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

  const validated = validateBody(showcaseBadgesSchema, body);
  if (validated instanceof Response) return validated;

  try {
    // Verify user owns all these badges
    if (validated.badgeIds.length > 0) {
      const { data: owned } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", auth.profileId)
        .in("badge_id", validated.badgeIds);

      const ownedSet = new Set((owned || []).map((b: any) => b.badge_id));
      const notOwned = validated.badgeIds.filter((id) => !ownedSet.has(id));
      if (notOwned.length > 0) {
        return Response.json({ error: "Badge non possede: " + notOwned.join(", ") }, { status: 400 });
      }
    }

    await supabaseAdmin
      .from("profiles")
      .update({ showcase_badges: validated.badgeIds })
      .eq("id", auth.profileId);

    return Response.json({ success: true, showcase_badges: validated.badgeIds });
  } catch (err) {
    return handleApiError(err, "BADGES_SHOWCASE");
  }
}
