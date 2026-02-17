import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getUserQuests, assignDailyQuests } from "@/services/quests.service";

/**
 * GET /api/quests — returns active quests with progress
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    // Ensure daily quests are assigned
    await assignDailyQuests(auth.profileId);
    const quests = await getUserQuests(auth.profileId);
    return Response.json(quests);
  } catch (err) {
    return handleApiError(err, "QUESTS_GET");
  }
}

/**
 * POST /api/quests — force assign daily quests (called at dashboard load)
 */
export async function POST() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    await assignDailyQuests(auth.profileId);
    const quests = await getUserQuests(auth.profileId);
    return Response.json(quests);
  } catch (err) {
    return handleApiError(err, "QUESTS_ASSIGN");
  }
}
