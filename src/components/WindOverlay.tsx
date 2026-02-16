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

const impactLabels: Record<string, string> = {
  very_unfavorable: "Vent de face fort",
  unfavorable: "Vent de face",
  neutral: "Vent neutre",
  favorable: "Vent de dos",
  very_favorable: "Vent de dos fort",
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
          if (map.getLayer("wind-circles")) map.removeLayer("wind-circles");
          if (map.getLayer("wind-speed-labels")) map.removeLayer("wind-speed-labels");
          if (map.getSource("wind-arrows")) map.removeSource("wind-arrows");
        } catch {}
      }
    };
  }, [enabled, points, map, targetDate]);

  const headwindPct = windData.length > 0
    ? Math.round((windData.filter((w) => w.headwindComponent > 5).length / windData.length) * 100)
    : 0;

  const tailwindPct = windData.length > 0
    ? Math.round((windData.filter((w) => w.headwindComponent < -5).length / windData.length) * 100)
    : 0;

  const avgWind = windData.length > 0
    ? Math.round(windData.reduce((s, w) => s + w.windSpeed, 0) / windData.length)
    : 0;

  const maxGust = windData.length > 0
    ? Math.round(Math.max(...windData.map((w) => w.windGust || w.windSpeed)))
    : 0;

  // Overall verdict
  const getVerdict = () => {
    if (headwindPct >= 60) return { text: "Conditions difficiles", color: "#EF4444" };
    if (headwindPct >= 40) return { text: "Vent de face frequent", color: "#F97316" };
    if (tailwindPct >= 50) return { text: "Conditions favorables", color: "#22C55E" };
    return { text: "Conditions correctes", color: "#94A3B8" };
  };

  const verdict = windData.length > 0 ? getVerdict() : null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
          </svg>
          <p className="text-[10px] font-bold tracking-wider text-white/30">ANALYSE DU VENT</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${
            enabled ? "bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30" : "bg-white/5 text-white/30 border border-white/10"
          }`}
        >
          {loading ? "Chargement..." : enabled ? "Actif" : "Activer"}
        </button>
      </div>

      {!enabled && !loading && (
        <p className="mt-2 text-[10px] text-white/20 leading-relaxed">
          Active cette option pour voir la direction et la force du vent sur ton parcours, avec des fleches sur la carte.
        </p>
      )}

      {enabled && windData.length > 0 && (
        <div className="mt-3 space-y-3">
          {/* Verdict banner */}
          {verdict && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: `${verdict.color}10`, border: `1px solid ${verdict.color}25` }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: verdict.color }}
              />
              <p className="text-xs font-bold" style={{ color: verdict.color }}>
                {verdict.text}
              </p>
            </div>
          )}

          {/* Summary stats - 4 columns */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono'] text-white">{avgWind}</p>
              <p className="text-[8px] text-white/30 leading-tight">KM/H<br />MOYEN</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono'] text-white/60">{maxGust}</p>
              <p className="text-[8px] text-white/30 leading-tight">KM/H<br />RAFALES</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono']" style={{ color: headwindPct > 50 ? "#EF4444" : headwindPct > 30 ? "#F97316" : "#94A3B8" }}>
                {headwindPct}%
              </p>
              <p className="text-[8px] text-white/30 leading-tight">VENT<br />DE FACE</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono']" style={{ color: tailwindPct > 50 ? "#22C55E" : tailwindPct > 30 ? "#4ADE80" : "#94A3B8" }}>
                {tailwindPct}%
              </p>
              <p className="text-[8px] text-white/30 leading-tight">VENT<br />DE DOS</p>
            </div>
          </div>

          {/* Wind bar visualization with km labels */}
          <div>
            <div className="flex h-4 overflow-hidden rounded-full">
              {windData.map((w, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center"
                  style={{ backgroundColor: impactColors[w.impact] }}
                >
                  <span className="text-[7px] font-bold text-black/50">{Math.round(w.windSpeed)}</span>
                </div>
              ))}
            </div>
            <div className="mt-0.5 flex">
              {windData.map((w, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] text-white/20">km {Math.round(w.km)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-point detail list */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold tracking-wider text-white/25 mb-1">DETAIL PAR SECTION</p>
            {windData.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: impactColors[w.impact] }}
                />
                <span className="text-[10px] font-mono text-white/40 w-12 shrink-0">
                  km {Math.round(w.km)}
                </span>
                <span className="text-[10px] font-bold text-white/70 w-14 shrink-0">
                  {w.windSpeed} km/h
                </span>
                <span className="text-[10px] text-white/30 flex-1 truncate">
                  {w.headwindComponent > 0
                    ? `Face ${Math.abs(w.headwindComponent)} km/h`
                    : w.headwindComponent < 0
                      ? `Dos ${Math.abs(w.headwindComponent)} km/h`
                      : "Lateral"}
                  {w.crosswindComponent > 8 && ` + lateral ${w.crosswindComponent} km/h`}
                </span>
                <span className="text-[9px] shrink-0" style={{ color: impactColors[w.impact] }}>
                  {impactLabels[w.impact]?.replace("Vent ", "") || ""}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-3 text-[8px] text-white/25 pt-1">
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

/** Create a wind arrow image for use as MapLibre symbol */
function createArrowImage(map: maplibregl.Map, id: string, color: string) {
  const size = 20; // était 32
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Flèche fine pointant vers le haut
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size / 2, 2);
  ctx.lineTo(size - 3, size - 3);
  ctx.lineTo(size / 2, size - 7);
  ctx.lineTo(3, size - 3);
  ctx.closePath();
  ctx.fill();

  // Contour sombre pour lisibilité
  ctx.strokeStyle = "#0B1120";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  if (!map.hasImage(id)) {
    map.addImage(id, imageData, { sdf: false });
  }
}

/** Add wind direction arrows as a GeoJSON layer on the MapLibre map */
function addWindArrowsToMap(map: maplibregl.Map, windData: WindPoint[]) {
  // Remove existing layers
  try {
    if (map.getLayer("wind-arrows")) map.removeLayer("wind-arrows");
    if (map.getLayer("wind-circles")) map.removeLayer("wind-circles");
    if (map.getLayer("wind-speed-labels")) map.removeLayer("wind-speed-labels");
    if (map.getSource("wind-arrows")) map.removeSource("wind-arrows");
  } catch {}

  // Create arrow images for each impact color
  const colorIds: Record<string, string> = {};
  Object.entries(impactColors).forEach(([impact, color]) => {
    const imageId = `wind-arrow-${impact}`;
    colorIds[impact] = imageId;
    createArrowImage(map, imageId, color);
  });

  const features = windData.map((w) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [w.lon, w.lat],
    },
    properties: {
      // +180 pour montrer OÙ VA le vent (pas d'où il vient)
      windDirection: (w.windDirection + 180) % 360,
      color: impactColors[w.impact],
      impact: w.impact,
      speed: w.windSpeed,
      speedLabel: `${Math.round(w.windSpeed)}`,
      arrowImage: colorIds[w.impact] || colorIds["neutral"],
    },
  }));

  map.addSource("wind-arrows", {
    type: "geojson",
    data: { type: "FeatureCollection", features },
  });

  // Background circle
  map.addLayer({
    id: "wind-circles",
    type: "circle",
    source: "wind-arrows",
    paint: {
      "circle-radius": 12,
      "circle-color": "#0B1120",
      "circle-opacity": 0.75,
      "circle-stroke-width": 1,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-opacity": 0.4,
    },
  });

  // Arrow symbols rotated by wind direction
  map.addLayer({
    id: "wind-arrows",
    type: "symbol",
    source: "wind-arrows",
    layout: {
      "icon-image": ["get", "arrowImage"],
      "icon-size": 0.75,
      "icon-rotate": ["get", "windDirection"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  // Speed labels below each arrow
  map.addLayer({
    id: "wind-speed-labels",
    type: "symbol",
    source: "wind-arrows",
    layout: {
      "text-field": ["get", "speedLabel"],
      "text-size": 8,
      "text-font": ["Open Sans Bold"],
      "text-offset": [0, 1.8],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "#0B1120",
      "text-halo-width": 1.5,
    },
  });
}
