import type { StravaActivity, ComputedStats, CardTier } from "@/types";

/**
 * PAC — Speed score weighted by elevation.
 */
function computePac(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0,
  );
  if (rides.length === 0) return 0;

  const weightedSpeeds = rides.map((a) => {
    const gradient = a.total_elevation_gain / (a.distance / 1000);
    return a.average_speed * 3.6 * (1 + gradient / 100);
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
  return Math.round(Math.min((maxKm / 200) * 99, 99));
}

/**
 * MON — Climbing score based on total D+ across all rides.
 */
function computeMon(activities: StravaActivity[]): number {
  const rides = activities.filter((a) => a.type === "Ride");
  if (rides.length === 0) return 0;
  const totalDplus = rides.reduce((s, a) => s + a.total_elevation_gain, 0);
  return Math.round(Math.min((totalDplus / 50000) * 99, 99));
}

/**
 * RES — Resistance/Power score based on weighted_average_watts from Strava.
 */
function computeRes(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0,
  );
  if (rides.length === 0) return 0;

  const ridesWithWatts = rides.filter(
    (a) => a.weighted_average_watts && a.weighted_average_watts > 0,
  );

  if (ridesWithWatts.length >= 3) {
    const sortedWatts = ridesWithWatts
      .map((a) => a.weighted_average_watts!)
      .sort((a, b) => b - a);
    const top20Count = Math.max(1, Math.ceil(sortedWatts.length * 0.2));
    const avgTopWatts =
      sortedWatts.slice(0, top20Count).reduce((s, v) => s + v, 0) / top20Count;
    return Math.round(Math.min((avgTopWatts / 300) * 99, 99));
  }

  const estimates = rides.map((a) => {
    const speedMs = a.average_speed;
    const gradePercent =
      a.distance > 0 ? (a.total_elevation_gain / a.distance) * 100 : 0;
    const flatPower = 3.0 * speedMs * speedMs * 0.5;
    const climbPower = 75 * 9.81 * (gradePercent / 100) * speedMs;
    return Math.max(flatPower + climbPower, 0);
  });

  const avgEstimate =
    estimates.reduce((s, v) => s + v, 0) / estimates.length;
  return Math.round(Math.min((avgEstimate / 300) * 99 * 0.8, 99));
}

/**
 * SPR — Sprint/Explosivity score based on max_speed / average_speed ratio.
 */
function computeSpr(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) => a.type === "Ride" && a.distance > 0 && a.max_speed > 0,
  );
  if (rides.length === 0) return 0;

  const maxSpeedCap = 80 / 3.6;

  const ratios = rides.map((a) => {
    const cappedMax = Math.min(a.max_speed, maxSpeedCap);
    return a.average_speed > 0 ? cappedMax / a.average_speed : 1;
  });

  const avgRatio = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  const normalized = Math.max(0, avgRatio - 1.0);
  return Math.round(Math.min((normalized / 1.0) * 99, 99));
}

/**
 * VAL — Technique/Vallonné score based on pacing efficiency + consistency.
 */
function computeVal(activities: StravaActivity[]): number {
  const rides = activities.filter(
    (a) =>
      a.type === "Ride" &&
      a.moving_time > 0 &&
      a.elapsed_time > 0 &&
      a.elapsed_time >= a.moving_time,
  );
  if (rides.length === 0) return 0;

  const efficiencyRatios = rides.map(
    (a) => a.moving_time / a.elapsed_time,
  );
  const avgEfficiency =
    efficiencyRatios.reduce((s, v) => s + v, 0) / efficiencyRatios.length;

  const speeds = rides.map((a) => a.average_speed);
  const avgSpeed = speeds.reduce((s, v) => s + v, 0) / speeds.length;
  const variance =
    speeds.reduce((s, v) => s + Math.pow(v - avgSpeed, 2), 0) / speeds.length;
  const cv = avgSpeed > 0 ? Math.sqrt(variance) / avgSpeed : 1;
  const consistencyScore = Math.max(0, 1 - cv);

  const combined = avgEfficiency * 0.7 + consistencyScore * 0.3;
  return Math.round(Math.min((combined / 0.95) * 99, 99));
}

/**
 * OVR — Overall Rating (weighted average of all 6 stats).
 */
export function computeOVR(stats: Omit<ComputedStats, 'ovr'>): number {
  return Math.round(
    stats.pac * 0.15 +
    stats.mon * 0.20 +
    stats.val * 0.10 +
    stats.spr * 0.10 +
    stats.end * 0.15 +
    stats.res * 0.30
  );
}

export function computeStats(activities: StravaActivity[]): ComputedStats {
  const pac = computePac(activities);
  const end = computeEnd(activities);
  const mon = computeMon(activities);
  const res = computeRes(activities);
  const spr = computeSpr(activities);
  const val = computeVal(activities);
  const ovr = computeOVR({ pac, end, mon, res, spr, val });

  return { pac, end, mon, res, spr, val, ovr };
}

export function getTier(stats: ComputedStats): CardTier {
  const ovr = stats.ovr;
  if (ovr >= 90) return "legende";
  if (ovr >= 80) return "diamant";
  if (ovr >= 65) return "platine";
  if (ovr >= 50) return "argent";
  return "bronze";
}
