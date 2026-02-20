import type { GpxPoint } from "@/types";

/* ══════ Types ══════ */

export interface GradientSegment {
  startIdx: number;
  endIdx: number;
  gradient: number; // percent
  distStart: number; // km from start
  distEnd: number; // km from start
  color: string;
}

export interface ClimbSegment {
  name: string;
  startIdx: number;
  endIdx: number;
  distStart: number; // km
  distEnd: number; // km
  elevGain: number; // meters
  length: number; // km
  avgGradient: number; // percent
  maxGradient: number; // percent
  startEle: number;
  endEle: number;
}

export interface DescentSegment {
  startIdx: number;
  endIdx: number;
  distStart: number;
  distEnd: number;
  elevDrop: number; // meters (positive)
  length: number; // km
  avgGradient: number; // percent (negative)
}

/* ══════ Gradient colors ══════ */

const GRADIENT_COLORS = {
  descent: "#3B82F6", // blue
  flat: "#22C55E", // green (0-3%)
  easy: "#EAB308", // yellow (3-5%)
  moderate: "#F97316", // orange (5-8%)
  hard: "#EF4444", // red (8-12%)
  extreme: "#9333EA", // violet (12%+)
} as const;

export function getGradientColor(gradient: number): string {
  if (gradient < -1) return GRADIENT_COLORS.descent;
  if (gradient < 3) return GRADIENT_COLORS.flat;
  if (gradient < 5) return GRADIENT_COLORS.easy;
  if (gradient < 8) return GRADIENT_COLORS.moderate;
  if (gradient < 12) return GRADIENT_COLORS.hard;
  return GRADIENT_COLORS.extreme;
}

/* ══════ Compute segment gradients ══════ */

export function computeSegmentGradients(
  points: GpxPoint[],
  smoothWindow = 5,
): GradientSegment[] {
  if (points.length < 2) return [];

  // Step 1: smooth elevations with moving average
  const smoothed = smoothElevations(points, smoothWindow);

  // Step 2: compute gradient for each pair of consecutive points
  const segments: GradientSegment[] = [];
  const segmentSize = Math.max(1, Math.floor(points.length / 200)); // ~200 segments max

  for (let i = 0; i < points.length - segmentSize; i += segmentSize) {
    const endI = Math.min(i + segmentSize, points.length - 1);
    const distKm = points[endI].distFromStart - points[i].distFromStart;

    if (distKm < 0.001) continue; // skip zero-distance segments

    const eleDiff = smoothed[endI] - smoothed[i];
    const gradient = (eleDiff / (distKm * 1000)) * 100;

    segments.push({
      startIdx: i,
      endIdx: endI,
      gradient: Math.round(gradient * 10) / 10,
      distStart: points[i].distFromStart,
      distEnd: points[endI].distFromStart,
      color: getGradientColor(gradient),
    });
  }

  return segments;
}

/* ══════ Identify climbs ══════ */

/**
 * Robust climb detection using running valley/peak tracking.
 *
 * Instead of relying on per-point up/down transitions (which break on
 * flat sections and internal dips), we track the deepest valley and
 * highest peak seen so far. A climb is finalized when we descend far
 * enough from the peak — with a *proportional* drop threshold so that
 * small dips inside a big climb don't split it prematurely.
 */
export function identifyClimbs(
  points: GpxPoint[],
  minGain = 35,
): ClimbSegment[] {
  if (points.length < 10) return [];

  // Adaptive smoothing: target ~500m window regardless of point density
  const totalDist = points[points.length - 1].distFromStart;
  const avgSpacing = totalDist / points.length; // km per point
  const smoothWindow = Math.max(
    5,
    Math.min(80, Math.round(0.5 / Math.max(avgSpacing, 0.001))),
  );
  const smoothed = smoothElevations(points, smoothWindow);

  const climbs: ClimbSegment[] = [];

  let valleyIdx = 0; // index of the lowest point (potential climb start)
  let peakIdx = 0; // index of the highest point after valley

  /** Try to record a climb from valleyIdx→peakIdx. */
  function tryRecord(vIdx: number, pIdx: number): boolean {
    const gain = smoothed[pIdx] - smoothed[vIdx];
    if (gain < minGain || pIdx <= vIdx) return false;

    const length = points[pIdx].distFromStart - points[vIdx].distFromStart;
    if (length <= 0.15) return false; // too short

    const avgGrad = (gain / (length * 1000)) * 100;
    if (avgGrad < 1.5) return false; // too gentle

    // Compute max gradient over the climb
    let maxGrad = 0;
    for (let j = vIdx + 1; j <= pIdx; j++) {
      const d = points[j].distFromStart - points[j - 1].distFromStart;
      if (d > 0.001) {
        const g = ((smoothed[j] - smoothed[j - 1]) / (d * 1000)) * 100;
        if (g > maxGrad) maxGrad = g;
      }
    }

    climbs.push({
      name: `Col ${climbs.length + 1}`,
      startIdx: vIdx,
      endIdx: pIdx,
      distStart: points[vIdx].distFromStart,
      distEnd: points[pIdx].distFromStart,
      elevGain: Math.round(gain),
      length: Math.round(length * 10) / 10,
      avgGradient: Math.round(avgGrad * 10) / 10,
      maxGradient: Math.round(maxGrad * 10) / 10,
      startEle: Math.round(smoothed[vIdx]),
      endEle: Math.round(smoothed[pIdx]),
    });
    return true;
  }

  for (let i = 1; i < points.length; i++) {
    const ele = smoothed[i];
    const gain = smoothed[peakIdx] - smoothed[valleyIdx];
    const drop = smoothed[peakIdx] - ele;

    // Dynamic threshold: split on 30m drop OR 20% of climb height
    // Each individual hill = its own col
    const dropThreshold = Math.max(30, gain * 0.2);

    // ── Finalize climb when we've descended enough from peak ──
    if (peakIdx > valleyIdx && gain >= minGain && drop >= dropThreshold) {
      tryRecord(valleyIdx, peakIdx);

      // Reset: find new valley & peak between old peak and current point
      valleyIdx = peakIdx;
      for (let j = peakIdx + 1; j <= i; j++) {
        if (smoothed[j] < smoothed[valleyIdx]) valleyIdx = j;
      }
      peakIdx = valleyIdx;
      for (let j = valleyIdx + 1; j <= i; j++) {
        if (smoothed[j] > smoothed[peakIdx]) peakIdx = j;
      }
    }

    // ── Update valley / peak tracking ──
    if (ele < smoothed[valleyIdx]) {
      // Going to a new low — if there's a pending significant climb, save it
      if (peakIdx > valleyIdx && gain >= minGain) {
        tryRecord(valleyIdx, peakIdx);
      }
      valleyIdx = i;
      peakIdx = i;
    } else if (ele > smoothed[peakIdx]) {
      peakIdx = i;
    }
  }

  // Handle final open climb at the end of the route
  if (peakIdx > valleyIdx) {
    tryRecord(valleyIdx, peakIdx);
  }

  return climbs;
}

/* ══════ Identify descents ══════ */

/**
 * Robust descent detection — mirror of climb detection.
 * Tracks running peak (descent start) and valley (descent end).
 */
export function identifyDescents(
  points: GpxPoint[],
  minDrop = 40,
): DescentSegment[] {
  if (points.length < 10) return [];

  const totalDist = points[points.length - 1].distFromStart;
  const avgSpacing = totalDist / points.length;
  const smoothWindow = Math.max(
    5,
    Math.min(80, Math.round(0.5 / Math.max(avgSpacing, 0.001))),
  );
  const smoothed = smoothElevations(points, smoothWindow);

  const descents: DescentSegment[] = [];

  let peakIdx = 0; // highest point (descent start)
  let valleyIdx = 0; // lowest point after peak (descent end)

  function tryRecord(pIdx: number, vIdx: number): boolean {
    const drop = smoothed[pIdx] - smoothed[vIdx];
    if (drop < minDrop || vIdx <= pIdx) return false;
    const length = points[vIdx].distFromStart - points[pIdx].distFromStart;
    if (length <= 0.15) return false;
    const avgGrad = (-drop / (length * 1000)) * 100;

    descents.push({
      startIdx: pIdx,
      endIdx: vIdx,
      distStart: points[pIdx].distFromStart,
      distEnd: points[vIdx].distFromStart,
      elevDrop: Math.round(drop),
      length: Math.round(length * 10) / 10,
      avgGradient: Math.round(avgGrad * 10) / 10,
    });
    return true;
  }

  for (let i = 1; i < points.length; i++) {
    const ele = smoothed[i];
    const drop = smoothed[peakIdx] - smoothed[valleyIdx];
    const rise = ele - smoothed[valleyIdx];

    const riseThreshold = Math.max(30, drop * 0.2);

    // Finalize descent when we've risen enough from valley
    if (valleyIdx > peakIdx && drop >= minDrop && rise >= riseThreshold) {
      tryRecord(peakIdx, valleyIdx);

      peakIdx = valleyIdx;
      for (let j = valleyIdx + 1; j <= i; j++) {
        if (smoothed[j] > smoothed[peakIdx]) peakIdx = j;
      }
      valleyIdx = peakIdx;
      for (let j = peakIdx + 1; j <= i; j++) {
        if (smoothed[j] < smoothed[valleyIdx]) valleyIdx = j;
      }
    }

    // Update tracking
    if (ele > smoothed[peakIdx]) {
      if (valleyIdx > peakIdx && drop >= minDrop) {
        tryRecord(peakIdx, valleyIdx);
      }
      peakIdx = i;
      valleyIdx = i;
    } else if (ele < smoothed[valleyIdx]) {
      valleyIdx = i;
    }
  }

  // Final descent
  if (valleyIdx > peakIdx) {
    tryRecord(peakIdx, valleyIdx);
  }

  return descents;
}

/* ══════ Helpers ══════ */

function smoothElevations(points: GpxPoint[], window: number): number[] {
  const elevations = points.map((p) => p.ele);
  const result: number[] = [];
  const half = Math.floor(window / 2);

  for (let i = 0; i < elevations.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(elevations.length - 1, i + half);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += elevations[j];
    }
    result.push(sum / (end - start + 1));
  }

  return result;
}

export function computeBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function sampleEquidistantPoints(
  points: GpxPoint[],
  count: number,
): GpxPoint[] {
  if (points.length <= count) return points;
  const step = (points.length - 1) / (count - 1);
  const sampled: GpxPoint[] = [];
  for (let i = 0; i < count; i++) {
    sampled.push(points[Math.round(i * step)]);
  }
  return sampled;
}
