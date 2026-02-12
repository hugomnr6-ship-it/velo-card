import type { StravaActivity, ComputedStats, CardTier } from "@/types";

/**
 * PAC — Speed score weighted by elevation.
 * avg_speed * (1 + elevation_gain / distance) averaged across rides.
 */
function computePac(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0,
  );
  if (rides.length === 0) return 0;

  const weightedSpeeds = rides.map((a) => {
    const gradient = a.total_elevation_gain / (a.distance / 1000); // m D+ per km
    return a.average_speed * 3.6 * (1 + gradient / 100); // km/h adjusted
  });
  const avg =
    weightedSpeeds.reduce((s, v) => s + v, 0) / weightedSpeeds.length;
  return Math.round(Math.min(avg, 99));
}

/**
 * END — Endurance score based on longest ride distance (km).
 */
function computeEnd(activities: StravaActivity[]): number {
  const rides = activities.filter((a) => a.type === "Ride");
  if (rides.length === 0) return 0;
  const maxKm = Math.max(...rides.map((a) => a.distance / 1000));
  // Scale: 200km+ = 99
  return Math.round(Math.min((maxKm / 200) * 99, 99));
}

/**
 * GRIM — Climbing score based on total D+ across all rides.
 */
function computeGrim(activities: StravaActivity[]): number {
  const rides = activities.filter((a) => a.type === "Ride");
  if (rides.length === 0) return 0;
  const totalDplus = rides.reduce((s, a) => s + a.total_elevation_gain, 0);
  // Scale: 50 000m+ cumulative = 99
  return Math.round(Math.min((totalDplus / 50000) * 99, 99));
}

export function computeStats(activities: StravaActivity[]): ComputedStats {
  return {
    pac: computePac(activities),
    end: computeEnd(activities),
    grim: computeGrim(activities),
  };
}

export function getTier(stats: ComputedStats): CardTier {
  const avg = (stats.pac + stats.end + stats.grim) / 3;
  if (avg >= 70) return "gold";
  if (avg >= 40) return "silver";
  return "bronze";
}
