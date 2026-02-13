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

/**
 * PUI — Power score based on weighted_average_watts from Strava.
 * Falls back to physics estimate if no watts data available.
 */
function computePui(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0,
  );
  if (rides.length === 0) return 0;

  // Primary: use weighted_average_watts from Strava
  const ridesWithWatts = rides.filter(
    (a) => a.weighted_average_watts && a.weighted_average_watts > 0,
  );

  if (ridesWithWatts.length >= 3) {
    // Use top 20% of rides by watts (best efforts)
    const sortedWatts = ridesWithWatts
      .map((a) => a.weighted_average_watts!)
      .sort((a, b) => b - a);
    const top20Count = Math.max(1, Math.ceil(sortedWatts.length * 0.2));
    const avgTopWatts =
      sortedWatts.slice(0, top20Count).reduce((s, v) => s + v, 0) / top20Count;
    // Scale: 300W+ = 99
    return Math.round(Math.min((avgTopWatts / 300) * 99, 99));
  }

  // Fallback: physics estimate from speed + elevation
  // Simplified model: power ~ air_resistance + gravity_component
  const estimates = rides.map((a) => {
    const speedMs = a.average_speed;
    const gradePercent =
      a.distance > 0 ? (a.total_elevation_gain / a.distance) * 100 : 0;
    // Rough estimate: ~75kg rider
    const flatPower = 3.0 * speedMs * speedMs * 0.5; // air resistance proxy
    const climbPower = 75 * 9.81 * (gradePercent / 100) * speedMs;
    return Math.max(flatPower + climbPower, 0);
  });

  const avgEstimate =
    estimates.reduce((s, v) => s + v, 0) / estimates.length;
  // Dampen fallback (less reliable than real watts)
  return Math.round(Math.min((avgEstimate / 300) * 99 * 0.8, 99));
}

/**
 * EXP — Explosivity score based on max_speed / average_speed ratio.
 * Higher ratio = more explosive (ability to produce bursts of speed).
 */
function computeExp(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0 && a.max_speed > 0,
  );
  if (rides.length === 0) return 0;

  const maxSpeedCap = 80 / 3.6; // 80 km/h in m/s, cap to filter GPS errors

  const ratios = rides.map((a) => {
    const cappedMax = Math.min(a.max_speed, maxSpeedCap);
    return a.average_speed > 0 ? cappedMax / a.average_speed : 1;
  });

  const avgRatio = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  // Scale: ratio >= 2.0 = 99, ratio 1.0 = 0
  const normalized = Math.max(0, avgRatio - 1.0);
  return Math.round(Math.min((normalized / 1.0) * 99, 99));
}

/**
 * TEC — Technique score based on pacing efficiency + consistency.
 * 70%: moving_time / elapsed_time ratio (fewer stops = better)
 * 30%: speed consistency across rides (lower variation = better)
 */
function computeTec(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) =>
      a.type === "Ride" &&
      a.moving_time > 0 &&
      a.elapsed_time > 0 &&
      a.elapsed_time >= a.moving_time,
  );
  if (rides.length === 0) return 0;

  // Factor 1: moving_time / elapsed_time ratio (efficiency)
  const efficiencyRatios = rides.map(
    (a) => a.moving_time / a.elapsed_time,
  );
  const avgEfficiency =
    efficiencyRatios.reduce((s, v) => s + v, 0) / efficiencyRatios.length;

  // Factor 2: speed consistency (lower coefficient of variation = better)
  const speeds = rides.map((a) => a.average_speed);
  const avgSpeed = speeds.reduce((s, v) => s + v, 0) / speeds.length;
  const variance =
    speeds.reduce((s, v) => s + Math.pow(v - avgSpeed, 2), 0) / speeds.length;
  const cv = avgSpeed > 0 ? Math.sqrt(variance) / avgSpeed : 1;
  const consistencyScore = Math.max(0, 1 - cv);

  // Combine: 70% efficiency + 30% consistency
  const combined = avgEfficiency * 0.7 + consistencyScore * 0.3;
  // Scale: 0.95+ = 99
  return Math.round(Math.min((combined / 0.95) * 99, 99));
}

export function computeStats(activities: StravaActivity[]): ComputedStats {
  return {
    pac: computePac(activities),
    end: computeEnd(activities),
    grim: computeGrim(activities),
    pui: computePui(activities),
    exp: computeExp(activities),
    tec: computeTec(activities),
  };
}

export function getTier(stats: ComputedStats): CardTier {
  // Tier stays based on PAC/END/GRIM only
  const avg = (stats.pac + stats.end + stats.grim) / 3;
  if (avg >= 70) return "gold";
  if (avg >= 40) return "silver";
  return "bronze";
}
