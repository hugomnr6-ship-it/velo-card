import type { StravaActivity } from "@/types";

/**
 * Garmin Connect API client
 * OAuth 1.0a — requires developer partnership approval
 *
 * NOTE: Garmin's API access requires applying at:
 * https://developer.garmin.com/gc-developer-program/overview/
 *
 * For the MVP, we use the Garmin Health API (wellness endpoint)
 * which provides activity summaries.
 *
 * OAuth 1.0a flow is handled via NextAuth with the oauth provider config.
 * The access token + token secret are stored and used for API calls.
 */

const GARMIN_API = "https://apis.garmin.com/wellness-api/rest";

interface GarminActivity {
  activityId: number;
  activityName: string;
  activityType: string; // "CYCLING", "ROAD_CYCLING", "MOUNTAIN_BIKING", etc.
  startTimeInSeconds: number; // epoch
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  movingDurationInSeconds?: number;
  distanceInMeters: number;
  elevationGainInMeters?: number;
  elevationLossInMeters?: number;
  averageSpeedInMetersPerSecond?: number;
  maxSpeedInMetersPerSecond?: number;
  averagePowerInWatts?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  startTimeLocal: string; // ISO
}

interface GarminUser {
  userId: string;
  displayName: string;
  profileImageUrl?: string;
}

/**
 * Build OAuth 1.0a Authorization header
 * In production, use a proper OAuth 1.0a library
 */
function buildOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string,
): string {
  // OAuth 1.0a header construction
  // In production, use 'oauth-1.0a' npm package
  const crypto = require("crypto");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const params: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: token,
    oauth_version: "1.0",
  };

  // Create signature base string
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  params.oauth_signature = signature;

  return "OAuth " + Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

/**
 * Fetch activities from Garmin Health API
 */
export async function fetchGarminActivities(
  token: string,
  tokenSecret: string,
  perPage = 50,
): Promise<GarminActivity[]> {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY!;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET!;

  // Fetch activities from the last 60 days
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - 60 * 24 * 60 * 60; // 60 days

  const url = `${GARMIN_API}/activities?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`;

  const authHeader = buildOAuth1Header(
    "GET", url, consumerKey, consumerSecret, token, tokenSecret,
  );

  const res = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Garmin API error: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return (data || []).slice(0, perPage);
}

/**
 * Convert Garmin activities to our normalized StravaActivity format
 */
export function garminToActivities(activities: GarminActivity[]): StravaActivity[] {
  const cyclingTypes = [
    "CYCLING", "ROAD_CYCLING", "MOUNTAIN_BIKING", "GRAVEL_CYCLING",
    "INDOOR_CYCLING", "VIRTUAL_RIDE",
  ];

  return activities
    .filter((a) => cyclingTypes.some((t) => a.activityType?.toUpperCase().includes(t)))
    .map((a) => ({
      id: a.activityId,
      name: a.activityName || "Garmin Ride",
      distance: a.distanceInMeters || 0,
      moving_time: a.movingDurationInSeconds || a.durationInSeconds || 0,
      elapsed_time: a.durationInSeconds || 0,
      total_elevation_gain: a.elevationGainInMeters || 0,
      average_speed: a.averageSpeedInMetersPerSecond || 0,
      max_speed: a.maxSpeedInMetersPerSecond || (a.averageSpeedInMetersPerSecond || 0) * 1.3,
      weighted_average_watts: a.averagePowerInWatts ?? undefined,
      start_date: a.startTimeLocal || new Date(a.startTimeInSeconds * 1000).toISOString(),
      type: "Ride",
    }));
}
