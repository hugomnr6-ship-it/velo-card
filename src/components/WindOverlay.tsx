"use client";

import { useEffect, useState } from "react";
import type maplibregl from "maplibre-gl";
import type { GpxPoint } from "@/types";
import { computeBearing, sampleEquidistantPoints } from "@/lib/gpx-analysis";
import { trackEvent } from "@/lib/analytics";

interface WindPoint {
  lat: number;
  lon: number;
  km: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  headwindComponent: number;
  crosswindComponent: number;
  impact: "very_unfavorable" | "unfavorable" | "neutral" | "favorable" | "very_favorable";
  routeBearing: number;
}

interface WindOverlayProps {
  points: GpxPoint[];
  map: maplibregl.Map | null;
  targetDate?: string;
}

const impactColors: Record<string, string> = {
  very_unfavorable: "#EF4444",
  unfavorable: "#F97316",
  neutral: "#94A3B8",
  favorable: "#4ADE80",
  very_favorable: "#22C55E",
};

function classifyWindImpact(headwind: number): WindPoint["impact"] {
  if (headwind > 15) return "very_unfavorable";
  if (headwind > 5) return "unfavorable";
  if (headwind > -5) return "neutral";
  if (headwind > -15) return "favorable";
  return "very_favorable";
}

export default function WindOverlay({ points, map, targetDate }: WindOverlayProps) {
  const [windData, setWindData] = useState<WindPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!enabled || points.length < 2) return;

    setLoading(true);
    trackEvent("wind_overlay_activated", { point_count: points.length });

    // Sample 10 equidistant points along the route
    const sampled = sampleEquidistantPoints(points, 10);
    const sampleKms = sampled.map((p) => p.distFromStart || 0);

    const body = {
      points: sampled.map((p, i) => ({
        lat: p.lat,
        lon: p.lon,
        km: sampleKms[i],
      })),
      date: targetDate,
    };

    fetch("/api/weather/route-wind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((rawPoints) => {
        if (!Array.isArray(rawPoints)) return;

        // Compute headwind/crosswind for each point
        const enriched: WindPoint[] = rawPoints.map((wp: any, i: number) => {
          // Get route bearing at this point
          const idx = Math.min(
            Math.floor((i / rawPoints.length) * (points.length - 1)),
            points.length - 2,
          );
          const bearing = computeBearing(
            points[idx].lat,
            points[idx].lon,
            points[idx + 1].lat,
            points[idx + 1].lon,
          );

          // Wind comes FROM windDirection, so headwind = cos(windDir - bearing)
          const angleDiff = ((wp.windDirection - bearing + 360) % 360) * (Math.PI / 180);
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

        setWindData(enriched);

        // Add wind arrows to map
        if (map) {
          addWindArrowsToMap(map, enriched);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      // Cleanup map layers on unmount
      if (map) {
        try {
          if (map.getLayer("wind-arrows")) map.removeLayer("wind-arrows");
          if (map.getSource("wind-arrows")) map.removeSource("wind-arrows");
        } catch {}
      }
    };
  }, [enabled, points, map, targetDate]);

  const headwindPct = windData.length > 0
    ? Math.round((windData.filter((w) => w.headwindComponent > 5).length / windData.length) * 100)
    : 0;

  const avgWind = windData.length > 0
    ? Math.round(windData.reduce((s, w) => s + w.windSpeed, 0) / windData.length)
    : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-wider text-white/30">VENT SUR LE PARCOURS</p>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${
            enabled ? "bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30" : "bg-white/5 text-white/30 border border-white/10"
          }`}
        >
          {loading ? "Chargement..." : enabled ? "Actif" : "Activer"}
        </button>
      </div>

      {enabled && windData.length > 0 && (
        <div className="mt-3 space-y-2">
          {/* Summary stats */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono'] text-white">{avgWind} km/h</p>
              <p className="text-[8px] text-white/30">VENT MOYEN</p>
            </div>
            <div className="flex-1 rounded-lg bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono']" style={{ color: headwindPct > 50 ? "#EF4444" : "#22C55E" }}>
                {headwindPct}%
              </p>
              <p className="text-[8px] text-white/30">VENT DE FACE</p>
            </div>
          </div>

          {/* Wind bar visualization */}
          <div className="flex h-3 overflow-hidden rounded-full">
            {windData.map((w, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: impactColors[w.impact] }}
                title={`Km ${w.km?.toFixed(1)} — ${w.windSpeed} km/h, ${w.headwindComponent > 0 ? "face" : "dos"}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-3 text-[8px] text-white/25">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#EF4444" }} /> Face fort
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#F97316" }} /> Face
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#94A3B8" }} /> Neutre
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#22C55E" }} /> Dos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Add wind direction arrows as a GeoJSON layer on the MapLibre map */
function addWindArrowsToMap(map: maplibregl.Map, windData: WindPoint[]) {
  // Remove existing layer
  try {
    if (map.getLayer("wind-arrows")) map.removeLayer("wind-arrows");
    if (map.getSource("wind-arrows")) map.removeSource("wind-arrows");
  } catch {}

  const features = windData.map((w) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [w.lon, w.lat],
    },
    properties: {
      windDirection: w.windDirection,
      color: impactColors[w.impact],
      speed: w.windSpeed,
    },
  }));

  map.addSource("wind-arrows", {
    type: "geojson",
    data: { type: "FeatureCollection", features },
  });

  map.addLayer({
    id: "wind-arrows",
    type: "circle",
    source: "wind-arrows",
    paint: {
      "circle-radius": 6,
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#0B1120",
      "circle-stroke-width": 2,
      "circle-opacity": 0.85,
    },
  });
}
