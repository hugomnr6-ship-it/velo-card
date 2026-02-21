import type { StravaActivity } from "@/types";
import { logger } from "@/lib/logger";

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchActivities(
  accessToken: string,
  perPage = 50,
): Promise<StravaActivity[]> {
  logger.debug("[STRAVA] Fetching activities", { tokenPrefix: accessToken?.substring(0, 8) });
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "no body");
    logger.error("[STRAVA] API error", { status: res.status, body });
    throw new Error(`Strava API error: ${res.status}`);
  }
  const activities = await res.json();
  logger.info("[STRAVA] Fetched activities", { count: activities.length });
  return activities;
}
