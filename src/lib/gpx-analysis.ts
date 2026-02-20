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

export function identifyClimbs(
  points: GpxPoint[],
  minGain = 50,
): ClimbSegment[] {
  if (points.length < 10) return [];

  // Adaptive smoothing: target ~500m window regardless of point density
  const totalDist = points[points.length - 1].distFromStart;
  const avgSpacing = totalDist / points.length; // km per point
  const smoothWindow = Math.max(5, Math.min(80, Math.round(0.5 / Math.max(avgSpacing, 0.001))));
  const smoothed = smoothElevations(points, smoothWindow);

  const climbs: ClimbSegment[] = [];

  let climbStart: number | null = null;
  let runningGain = 0;
  let maxGrad = 0;
  let highPoint = 0; // running maximum elevation in current climb

  for (let i = 1; i < points.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];
    const distKm = points[i].distFromStart - points[i - 1].distFromStart;

    if (diff > 0) {
      if (climbStart === null) {
        climbStart = i - 1;
        runningGain = 0;
        maxGrad = 0;
        highPoint = smoothed[i - 1];
      }
      runningGain += diff;
      highPoint = Math.max(highPoint, smoothed[i]);
      if (distKm > 0.001) {
        const grad = (diff / (distKm * 1000)) * 100;
        maxGrad = Math.max(maxGrad, grad);
      }
    } else if (diff < 0 && climbStart !== null) {
      // Measure the drop from the highest point in this climb
      const dropFromPeak = highPoint - smoothed[i];

      // End climb if we've descended significantly from the peak
      if (dropFromPeak > 30 || (runningGain > 0 && dropFromPeak > runningGain * 0.3)) {
        if (runningGain >= minGain) {
          // Find the actual peak index
          let peakIdx = climbStart;
          for (let j = climbStart; j <= i; j++) {
            if (smoothed[j] > smoothed[peakIdx]) peakIdx = j;
          }
          const length = points[peakIdx].distFromStart - points[climbStart].distFromStart;
          const actualGain = smoothed[peakIdx] - smoothed[climbStart];
          const avgGrad = length > 0 ? (actualGain / (length * 1000)) * 100 : 0;
          // Only record if real climb: ≥50m gain, ≥200m long, ≥2% avg gradient
          if (actualGain >= minGain && length > 0.2 && avgGrad >= 2) {
            climbs.push({
              name: `Col ${climbs.length + 1}`,
              startIdx: climbStart,
              endIdx: peakIdx,
              distStart: points[climbStart].distFromStart,
              distEnd: points[peakIdx].distFromStart,
              elevGain: Math.round(actualGain),
              length: Math.round(length * 10) / 10,
              avgGradient: Math.round(avgGrad * 10) / 10,
              maxGradient: Math.round(maxGrad * 10) / 10,
              startEle: Math.round(smoothed[climbStart]),
              endEle: Math.round(smoothed[peakIdx]),
            });
          }
        }
        climbStart = null;
        runningGain = 0;
        maxGrad = 0;
      }
    }
  }

  // Close final climb if still open
  if (climbStart !== null && runningGain >= minGain) {
    let peakIdx = climbStart;
    for (let j = climbStart; j < points.length; j++) {
      if (smoothed[j] > smoothed[peakIdx]) peakIdx = j;
    }
    const length = points[peakIdx].distFromStart - points[climbStart].distFromStart;
    const actualGain = smoothed[peakIdx] - smoothed[climbStart];
    const avgGrad = length > 0 ? (actualGain / (length * 1000)) * 100 : 0;
    if (actualGain >= minGain && length > 0.2 && avgGrad >= 2) {
      climbs.push({
        name: `Col ${climbs.length + 1}`,
        startIdx: climbStart,
        endIdx: peakIdx,
        distStart: points[climbStart].distFromStart,
        distEnd: points[peakIdx].distFromStart,
        elevGain: Math.round(actualGain),
        length: Math.round(length * 10) / 10,
        avgGradient: Math.round(avgGrad * 10) / 10,
        maxGradient: Math.round(maxGrad * 10) / 10,
        startEle: Math.round(smoothed[climbStart]),
        endEle: Math.round(smoothed[peakIdx]),
      });
    }
  }

  return climbs;
}

/* ══════ Identify descents ══════ */

export function identifyDescents(
  points: GpxPoint[],
  minDrop = 50,
): DescentSegment[] {
  if (points.length < 10) return [];

  // Adaptive smoothing: same as climbs (~500m window)
  const totalDist = points[points.length - 1].distFromStart;
  const avgSpacing = totalDist / points.length;
  const smoothWindow = Math.max(5, Math.min(80, Math.round(0.5 / Math.max(avgSpacing, 0.001))));
  const smoothed = smoothElevations(points, smoothWindow);

  const descents: DescentSegment[] = [];

  let descentStart: number | null = null;
  let runningDrop = 0;
  let runningGain = 0;

  for (let i = 1; i < points.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];

    if (diff < 0) {
      if (descentStart === null) {
        descentStart = i - 1;
        runningDrop = 0;
        runningGain = 0;
      }
      runningDrop += Math.abs(diff);
      runningGain = 0; // Reset: only track current ascent depth
    } else if (diff > 0 && descentStart !== null) {
      runningGain += diff;
      if (runningGain > 30 || (runningDrop > 0 && runningGain > runningDrop * 0.3)) {
        if (runningDrop >= minDrop) {
          const length = points[i - 1].distFromStart - points[descentStart].distFromStart;
          descents.push({
            startIdx: descentStart,
            endIdx: i - 1,
            distStart: points[descentStart].distFromStart,
            distEnd: points[i - 1].distFromStart,
            elevDrop: Math.round(runningDrop),
            length: Math.round(length * 10) / 10,
            avgGradient: length > 0 ? Math.round((-runningDrop / (length * 1000)) * 1000) / 10 : 0,
          });
        }
        descentStart = null;
        runningDrop = 0;
        runningGain = 0;
      }
    }
  }

  if (descentStart !== null && runningDrop >= minDrop) {
    const lastIdx = points.length - 1;
    const length = points[lastIdx].distFromStart - points[descentStart].distFromStart;
    descents.push({
      startIdx: descentStart,
      endIdx: lastIdx,
      distStart: points[descentStart].distFromStart,
      distEnd: points[lastIdx].distFromStart,
      elevDrop: Math.round(runningDrop),
      length: Math.round(length * 10) / 10,
      avgGradient: length > 0 ? Math.round((-runningDrop / (length * 1000)) * 1000) / 10 : 0,
    });
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
