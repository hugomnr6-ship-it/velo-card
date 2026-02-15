"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AnimatedPage from "@/components/AnimatedPage";
import GpxDropZone from "@/components/GpxDropZone";
import ElevationProfile from "@/components/ElevationProfile";
import {
  computeSegmentGradients,
  identifyClimbs,
  identifyDescents,
  type GradientSegment,
  type ClimbSegment,
  type DescentSegment,
} from "@/lib/gpx-analysis";
import { computeRdi } from "@/lib/rdi";
import { trackEvent } from "@/lib/analytics";
import { IconMountain, IconCycling } from "@/components/icons/VeloIcons";
import type { RouteSummary, WeatherData, RdiResult } from "@/types";

// Dynamic import MapLibre (no SSR)
const CourseMap = dynamic(() => import("@/components/CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full animate-pulse rounded-2xl bg-white/5" />
  ),
});

export default function CourseClient() {
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [segments, setSegments] = useState<GradientSegment[]>([]);
  const [climbs, setClimbs] = useState<ClimbSegment[]>([]);
  const [descents, setDescents] = useState<DescentSegment[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rdi, setRdi] = useState<RdiResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const handleRouteParsed = useCallback(async (routeSummary: RouteSummary) => {
    setSummary(routeSummary);

    // Compute analysis
    const segs = computeSegmentGradients(routeSummary.points);
    const climbList = identifyClimbs(routeSummary.points);
    const descentList = identifyDescents(routeSummary.points);
    setSegments(segs);
    setClimbs(climbList);
    setDescents(descentList);

    trackEvent("gpx_uploaded", {
      distance_km: routeSummary.totalDistanceKm,
      elevation_gain: routeSummary.totalElevationGain,
      climb_count: climbList.length,
    });

    // Fetch weather for route center
    setLoadingWeather(true);
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: routeSummary.centerLat,
          lon: routeSummary.centerLon,
        }),
      });
      if (res.ok) {
        const w: WeatherData = await res.json();
        setWeather(w);
        setRdi(computeRdi(routeSummary, w));
      } else {
        // Still compute RDI without weather
        setRdi(computeRdi(routeSummary, null));
      }
    } catch {
      setRdi(computeRdi(routeSummary, null));
    }
    setLoadingWeather(false);
  }, []);

  const rdiColors: Record<string, string> = {
    Facile: "#22C55E",
    "Modéré": "#EAB308",
    Difficile: "#F97316",
    "Extrême": "#EF4444",
  };

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      <h1 className="text-xl font-black tracking-wide text-white font-['Space_Grotesk']">
        Analyse de Parcours
      </h1>
      <p className="mt-1 text-xs text-white/30">
        Importe un fichier GPX pour analyser ton parcours
      </p>

      <div className="mt-6 w-full max-w-lg">
        <GpxDropZone onRouteParsed={handleRouteParsed} />
      </div>

      {summary && (
        <div className="mt-6 w-full max-w-lg flex flex-col gap-4">
          {/* ═══ Route summary cards ═══ */}
          <div className="grid grid-cols-4 gap-2">
            <SummaryCard
              label="Distance"
              value={`${summary.totalDistanceKm}`}
              unit="km"
            />
            <SummaryCard
              label="D+"
              value={`${summary.totalElevationGain}`}
              unit="m"
            />
            <SummaryCard
              label="Alt. Max"
              value={`${summary.maxElevation}`}
              unit="m"
            />
            <SummaryCard
              label="Alt. Min"
              value={`${summary.minElevation}`}
              unit="m"
            />
          </div>

          {/* ═══ RDI + Weather ═══ */}
          <div className="flex gap-2">
            {rdi && (
              <div
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 flex flex-col items-center"
              >
                <span className="text-[9px] font-bold tracking-wider text-white/30">
                  DIFFICULTE
                </span>
                <span
                  className="mt-1 text-2xl font-black font-['JetBrains_Mono']"
                  style={{ color: rdiColors[rdi.label] || "#6366F1" }}
                >
                  {rdi.score}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: rdiColors[rdi.label] || "#6366F1" }}
                >
                  {rdi.label}
                </span>
              </div>
            )}
            {weather && (
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 flex flex-col items-center">
                <span className="text-[9px] font-bold tracking-wider text-white/30">
                  METEO
                </span>
                <span className="mt-1 text-2xl font-black font-['JetBrains_Mono'] text-white">
                  {weather.temperature}°
                </span>
                <span className="text-[10px] text-white/40">
                  Vent {weather.windSpeedKmh} km/h {weather.windDirection}
                </span>
              </div>
            )}
            {loadingWeather && !weather && (
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 flex items-center justify-center">
                <span className="text-xs text-white/30 animate-pulse">
                  Chargement meteo...
                </span>
              </div>
            )}
          </div>

          {/* ═══ Map ═══ */}
          <CourseMap
            points={summary.points}
            segments={segments}
            centerLat={summary.centerLat}
            centerLon={summary.centerLon}
          />

          {/* ═══ Elevation Profile ═══ */}
          <ElevationProfile points={summary.points} climbs={climbs} />

          {/* ═══ Climbs list ═══ */}
          {climbs.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">
                <IconMountain size={12} className="inline mr-1" />
                MONTEES DETECTEES ({climbs.length})
              </p>
              <div className="flex flex-col gap-2">
                {climbs.map((climb, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 border border-white/[0.04]"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black"
                      style={{
                        backgroundColor:
                          climb.avgGradient >= 8
                            ? "rgba(239,68,68,0.15)"
                            : climb.avgGradient >= 5
                              ? "rgba(249,115,22,0.15)"
                              : "rgba(234,179,8,0.15)",
                        color:
                          climb.avgGradient >= 8
                            ? "#EF4444"
                            : climb.avgGradient >= 5
                              ? "#F97316"
                              : "#EAB308",
                      }}
                    >
                      {climb.avgGradient}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {climb.name}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {climb.length} km · {climb.elevGain}m D+ · {climb.startEle}m → {climb.endEle}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/50">
                        max {climb.maxGradient}%
                      </p>
                      <p className="text-[9px] text-white/20">
                        KM {Math.round(climb.distStart * 10) / 10}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Descents list ═══ */}
          {descents.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">
                <IconCycling size={12} className="inline mr-1" />
                DESCENTES ({descents.length})
              </p>
              <div className="flex flex-col gap-2">
                {descents.map((descent, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 border border-white/[0.04]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-[10px] font-black text-blue-400">
                      ↓
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-white/40">
                        {descent.length} km · {descent.elevDrop}m · moy. {descent.avgGradient}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}

/* ═══ Small helper component ═══ */

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
      <span className="text-sm font-black text-white font-['JetBrains_Mono']">
        {value}
      </span>
      <span className="text-[8px] font-bold tracking-wider text-white/30">
        {unit}
      </span>
      <span className="mt-0.5 text-[8px] text-white/20">{label}</span>
    </div>
  );
}
