import type { StravaActivity } from "@/types";

const STRAVA_API = "https://www.strava.com/api/v3";

export async function fetchActivities(
  accessToken: string,
  perPage = 50,
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}
