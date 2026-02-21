import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getDailyDuel, acceptDailyDuel, declineDailyDuel } from "@/services/daily-duel.service";

/**
 * GET /api/duels/daily — Récupère le duel du jour (ou le génère).
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const dailyDuel = await getDailyDuel(auth.profileId);
    return Response.json(dailyDuel);
  } catch (err) {
    return handleApiError(err, "DAILY_DUEL_GET");
  }
}

/**
 * POST /api/duels/daily — Accepter ou décliner le duel du jour.
 * Body: { action: "accept" | "decline" }
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const { action } = await request.json();

    if (action === "accept") {
      const duel = await acceptDailyDuel(auth.profileId);
      return Response.json({ accepted: true, duel });
    } else if (action === "decline") {
      await declineDailyDuel(auth.profileId);
      return Response.json({ declined: true });
    }

    return Response.json(
      { error: { code: "INVALID_ACTION", message: "Action invalide (accept ou decline)" } },
      { status: 400 },
    );
  } catch (err) {
    return handleApiError(err, "DAILY_DUEL_ACTION");
  }
}
