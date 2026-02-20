"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import GpxDropZone from "@/components/GpxDropZone";
import ElevationProfile from "@/components/ElevationProfile";
import WindOverlay from "@/components/WindOverlay";
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
import ClimbsPanel from "@/components/course/ClimbsPanel";
import type { CardTier, RouteSummary, WeatherData, RdiResult } from "@/types";
import type maplibregl from "maplibre-gl";

// Dynamic import MapLibre (no SSR)
const CourseMap = dynamic(() => import("@/components/CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full animate-pulse rounded-2xl bg-white/5" />
  ),
});

interface RouteAnalysisSectionProps {
  tier: CardTier;
}

export default function RouteAnalysisSection({
  tier,
}: RouteAnalysisSectionProps) {
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [segments, setSegments] = useState<GradientSegment[]>([]);
  const [climbs, setClimbs] = useState<ClimbSegment[]>([]);
  const [descents, setDescents] = useState<DescentSegment[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rdi, setRdi] = useState<RdiResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [activeClimbIdx, setActiveClimbIdx] = useState<number | null>(null);

  const rdiColors: Record<string, string> = {
    Facile: "#22C55E",
    "Modéré": "#EAB308",
    Difficile: "#F97316",
    "Extrême": "#EF4444",
  };

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
        setRdi(computeRdi(routeSummary, null));
      }
    } catch {
      setRdi(computeRdi(routeSummary, null));
    }
    setLoadingWeather(false);
  }, []);

  function handleRouteReset() {
    setSummary(null);
    setSegments([]);
    setClimbs([]);
    setDescents([]);
    setWeather(null);
    setRdi(null);
    setMapInstance(null);
  }

  return (
    <section className="mt-8 w-full max-w-2xl">
      {/* Section divider */}
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <h2 className="mb-4 text-center text-lg font-bold tracking-wide text-white">
        Analyse de parcours
      </h2>

      <GpxDropZone onRouteParsed={handleRouteParsed} />

      {summary && (
        <div className="mt-6 flex flex-col gap-4">
          {/* ═══ Route summary cards ═══ */}
          <div className="grid grid-cols-4 gap-2">
            <SummaryCard label="Distance" value={`${summary.totalDistanceKm}`} unit="km" />
            <SummaryCard label="D+" value={`${summary.totalElevationGain}`} unit="m" />
            <SummaryCard label="Alt. Max" value={`${summary.maxElevation}`} unit="m" />
            <SummaryCard label="Alt. Min" value={`${summary.minElevation}`} unit="m" />
          </div>

          {/* ═══ RDI + Weather ═══ */}
          <div className="flex gap-2">
            {rdi && (
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 flex flex-col items-center">
                <span className="text-[9px] font-bold tracking-wider text-white/30">DIFFICULTE</span>
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
                <span className="text-[9px] font-bold tracking-wider text-white/30">METEO</span>
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
                <span className="text-xs text-white/30 animate-pulse">Chargement meteo...</span>
              </div>
            )}
          </div>

          {/* ═══ Map ═══ */}
          <CourseMap
            points={summary.points}
            segments={segments}
            centerLat={summary.centerLat}
            centerLon={summary.centerLon}
            onMapReady={setMapInstance}
          />

          {/* ═══ Wind Overlay ═══ */}
          <WindOverlay points={summary.points} map={mapInstance} />

          {/* ═══ Elevation Profile ═══ */}
          <ElevationProfile points={summary.points} climbs={climbs} />

          {/* ═══ Climbs / Descents ═══ */}
          {(climbs.length > 0 || descents.length > 0) && (
            <ClimbsPanel
              climbs={climbs}
              descents={descents}
              activeClimbIdx={activeClimbIdx}
              onClimbClick={(idx) => setActiveClimbIdx((prev) => (prev === idx ? null : idx))}
              points={summary.points}
            />
          )}

          {/* Reset button */}
          <button
            onClick={handleRouteReset}
            className="mx-auto mt-2 text-sm text-[#94A3B8] underline hover:text-white/80"
          >
            Analyser un autre parcours
          </button>
        </div>
      )}
    </section>
  );
}

/* ═══ Small helper component ═══ */
function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
      <span className="text-sm font-black text-white font-['JetBrains_Mono']">{value}</span>
      <span className="text-[8px] font-bold tracking-wider text-white/30">{unit}</span>
      <span className="mt-0.5 text-[8px] text-white/20">{label}</span>
    </div>
  );
}
