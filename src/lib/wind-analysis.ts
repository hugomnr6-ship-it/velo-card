import type { GpxPoint } from "@/types";
import { computeBearing, sampleEquidistantPoints } from "./gpx-analysis";

/* ═══ Types ═══ */

export interface WindPoint {
  lat: number;
  lon: number;
  km: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  headwindComponent: number;
  crosswindComponent: number;
  impact: WindImpact;
  routeBearing: number;
}

export type WindImpact =
  | "very_unfavorable"
  | "unfavorable"
  | "neutral"
  | "favorable"
  | "very_favorable";

export const impactColors: Record<WindImpact, string> = {
  very_unfavorable: "#EF4444",
  unfavorable: "#F97316",
  neutral: "#94A3B8",
  favorable: "#4ADE80",
  very_favorable: "#22C55E",
};

export const impactLabels: Record<WindImpact, string> = {
  very_unfavorable: "Vent de face fort",
  unfavorable: "Vent de face",
  neutral: "Vent neutre",
  favorable: "Vent de dos",
  very_favorable: "Vent de dos fort",
};

/* ═══ Classification ═══ */

export function classifyWindImpact(headwind: number): WindImpact {
  if (headwind > 15) return "very_unfavorable";
  if (headwind > 5) return "unfavorable";
  if (headwind > -5) return "neutral";
  if (headwind > -15) return "favorable";
  return "very_favorable";
}

/* ═══ Enrich raw wind data with headwind/crosswind ═══ */

export function enrichWindData(
  rawPoints: any[],
  routePoints: GpxPoint[]
): WindPoint[] {
  return rawPoints.map((wp: any, i: number) => {
    const idx = Math.min(
      Math.floor((i / rawPoints.length) * (routePoints.length - 1)),
      routePoints.length - 2
    );
    const bearing = computeBearing(
      routePoints[idx].lat,
      routePoints[idx].lon,
      routePoints[idx + 1].lat,
      routePoints[idx + 1].lon
    );

    const angleDiff =
      ((wp.windDirection - bearing + 360) % 360) * (Math.PI / 180);
    const headwind = wp.windSpeed * Math.cos(angleDiff);
    const crosswind = Math.abs(wp.windSpeed * Math.sin(angleDiff));

    return {
      ...wp,
      routeBearing: bearing,
      headwindComponent: Math.round(headwind * 10) / 10,
      crosswindComponent: Math.round(crosswind * 10) / 10,
      impact: classifyWindImpact(headwind),
    };
  });
}

/* ═══ Compute wind stats ═══ */

export interface WindStats {
  headwindPct: number;
  tailwindPct: number;
  lateralPct: number;
  avgWind: number;
  maxGust: number;
}

export function computeWindStats(windData: WindPoint[]): WindStats {
  if (windData.length === 0) {
    return { headwindPct: 0, tailwindPct: 0, lateralPct: 0, avgWind: 0, maxGust: 0 };
  }

  const headwindPct = Math.round(
    (windData.filter((w) => w.headwindComponent > 5).length / windData.length) * 100
  );
  const tailwindPct = Math.round(
    (windData.filter((w) => w.headwindComponent < -5).length / windData.length) * 100
  );
  const lateralPct = 100 - headwindPct - tailwindPct;
  const avgWind = Math.round(
    windData.reduce((s, w) => s + w.windSpeed, 0) / windData.length
  );
  const maxGust = Math.round(
    Math.max(...windData.map((w) => w.windGust || w.windSpeed))
  );

  return { headwindPct, tailwindPct, lateralPct, avgWind, maxGust };
}

/* ═══ Verdict ═══ */

export interface WindVerdict {
  text: string;
  color: string;
  bgColor: string;
}

export function getWindVerdict(stats: WindStats): WindVerdict {
  if (stats.headwindPct >= 60)
    return { text: "Conditions difficiles", color: "#EF4444", bgColor: "#EF444410" };
  if (stats.headwindPct >= 40)
    return { text: "Vent defavorable", color: "#F97316", bgColor: "#F9731610" };
  if (stats.tailwindPct >= 50)
    return { text: "Conditions favorables !", color: "#22C55E", bgColor: "#22C55E10" };
  return { text: "Conditions correctes", color: "#94A3B8", bgColor: "#94A3B810" };
}

/* ═══ Fetch wind data from API ═══ */

export async function fetchWindData(
  routePoints: GpxPoint[],
  targetDate?: string
): Promise<WindPoint[]> {
  const sampled = sampleEquidistantPoints(routePoints, 10);

  const body = {
    points: sampled.map((p) => ({
      lat: p.lat,
      lon: p.lon,
      km: p.distFromStart || 0,
    })),
    date: targetDate,
  };

  const res = await fetch("/api/weather/route-wind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const rawPoints = await res.json();
  if (!Array.isArray(rawPoints)) return [];

  return enrichWindData(rawPoints, routePoints);
}
