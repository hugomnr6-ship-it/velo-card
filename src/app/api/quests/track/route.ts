import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { trackQuestEvent } from "@/services/quests.service";
import { z } from "zod";

const trackSchema = z.object({
  metric: z.enum([
    "leaderboard_view",
    "duel_created",
    "shop_view",
    "card_view",
    "profile_view",
    "duel_club_member",
    "card_compare",
    "badges_view",
  ]),
});

/**
 * POST /api/quests/track — enregistre un événement contextuel pour les quêtes.
 * Body: { metric: "leaderboard_view" | "shop_view" | ... }
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const validated = validateBody(trackSchema, body);
    if (validated instanceof Response) return validated;

    const completed = await trackQuestEvent(auth.profileId, validated.metric);
    return Response.json({ tracked: true, completedQuests: completed });
  } catch (err) {
    return handleApiError(err, "QUESTS_TRACK");
  }
}
