import type { StravaActivity } from "@/types";

/**
 * Wahoo Cloud API v1 client
 * OAuth 2.0 — similar to Strava
 * Docs: https://cloud-api.wahooligan.com/docs
 */

const WAHOO_API = "https://api.wahooligan.com/v1";

interface WahooWorkout {
  id: number;
  name: string;
  workout_type: string; // "CYCLING", "RUNNING", etc.
  starts: string; // ISO date
  duration_active_accum: number; // seconds
  duration_total_accum: number; // seconds
  distance_accum: number; // meters
  ascent_accum: number; // meters
  speed_avg: number; // m/s
  speed_max?: number; // not always available
  power_avg?: number; // watts
  heart_rate_avg?: number;
  calories_accum?: number;
}

interface WahooUser {
  id: number;
  first: string;
  last: string;
  email: string;
  // Wahoo doesn't provide profile pictures via API
}

/**
 * Fetch the authenticated Wahoo user profile
 */
export async function fetchWahooUser(accessToken: string): Promise<WahooUser> {
  const res = await fetch(`${WAHOO_API}/user`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Wahoo user API error: ${res.status}`);
  const data = await res.json();
  return data.user || data;
}

/**
 * Fetch recent workouts from Wahoo
 */
export async function fetchWahooWorkouts(
  accessToken: string,
  perPage = 50,
): Promise<WahooWorkout[]> {
  const res = await fetch(
    `${WAHOO_API}/workouts?per_page=${perPage}&order=descending`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Wahoo API error: ${res.status}`);
  const data = await res.json();
  return data.workouts || [];
}

/**
 * Convert Wahoo workouts to our normalized StravaActivity format
 * This lets us reuse the same stats computation pipeline
 */
export function wahooToActivities(workouts: WahooWorkout[]): StravaActivity[] {
  return workouts
    .filter((w) => w.workout_type === "CYCLING" || w.workout_type === "Ride")
    .map((w) => ({
      id: w.id,
      name: w.name || "Wahoo Ride",
      distance: w.distance_accum || 0,
      moving_time: w.duration_active_accum || 0,
      elapsed_time: w.duration_total_accum || w.duration_active_accum || 0,
      total_elevation_gain: w.ascent_accum || 0,
      average_speed: w.speed_avg || 0,
      max_speed: w.speed_max || w.speed_avg * 1.3 || 0, // estimate if missing
      weighted_average_watts: w.power_avg ?? undefined,
      start_date: w.starts,
      type: "Ride",
    }));
}
