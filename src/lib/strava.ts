import type { StravaActivity } from "@/types";

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchActivities(
  accessToken: string,
  perPage = 50,
): Promise<StravaActivity[]> {
  console.log("[STRAVA] Fetching activities, token starts with:", accessToken?.substring(0, 8) + "...");
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "no body");
    console.error("[STRAVA] API error:", res.status, body);
    throw new Error(`Strava API error: ${res.status}`);
  }
  const activities = await res.json();
  console.log("[STRAVA] Got", activities.length, "activities");
  return activities;
}
