"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import GpxDropZone from "@/components/GpxDropZone";
import ElevationProfile from "@/components/ElevationProfile";
import StatsRow from "@/components/course/StatsRow";
import ClimbsPanel from "@/components/course/ClimbsPanel";
import WindWeatherPanel from "@/components/course/WindWeatherPanel";
import {
  computeSegmentGradients,
  identifyClimbs,
  identifyDescents,
  type GradientSegment,
  type ClimbSegment,
  type DescentSegment,
} from "@/lib/gpx-analysis";
import { computeRdi } from "@/lib/rdi";
import { fetchWindData, type WindPoint } from "@/lib/wind-analysis";
import { trackEvent } from "@/lib/analytics";
import type { RouteSummary, WeatherData, RdiResult } from "@/types";

// Dynamic import MapLibre (no SSR)
const CourseMap = dynamic(() => import("@/components/CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-2xl bg-white/5" />
  ),
});

export default function CourseClient() {
  // ═══ Core state ═══
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [segments, setSegments] = useState<GradientSegment[]>([]);
  const [climbs, setClimbs] = useState<ClimbSegment[]>([]);
  const [descents, setDescents] = useState<DescentSegment[]>([]);
  const [gpxFileName, setGpxFileName] = useState<string>("");

  // ═══ Weather & wind ═══
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rdi, setRdi] = useState<RdiResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [windData, setWindData] = useState<WindPoint[] | null>(null);
  const [showWind, setShowWind] = useState(false);
  const [loadingWind, setLoadingWind] = useState(false);

  // ═══ Sync state ═══
  const [hoveredKm, setHoveredKm] = useState<number | null>(null);
  const [activeClimbIdx, setActiveClimbIdx] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // ═══ GPX parsed handler ═══
  const handleRouteParsed = useCallback(
    async (routeSummary: RouteSummary) => {
      setSummary(routeSummary);

      // Reset previous state
      setWindData(null);
      setShowWind(false);
      setHoveredKm(null);
      setActiveClimbIdx(null);

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
          setWeather(null);
          setRdi(computeRdi(routeSummary, null));
        }
      } catch {
        setWeather(null);
        setRdi(computeRdi(routeSummary, null));
      }
      setLoadingWeather(false);
    },
    []
  );

  // ═══ Wind toggle ═══
  const handleToggleWind = useCallback(async () => {
    if (showWind) {
      setShowWind(false);
      return;
    }

    if (!summary) return;

    // If we already have data, just show it
    if (windData && windData.length > 0) {
      setShowWind(true);
      return;
    }

    // Fetch wind data
    setLoadingWind(true);
    setShowWind(true);
    try {
      trackEvent("wind_overlay_activated", {
        point_count: summary.points.length,
      });
      const data = await fetchWindData(summary.points);
      setWindData(data);
    } catch {
      setWindData(null);
    }
    setLoadingWind(false);
  }, [showWind, summary, windData]);

  // ═══ Climb click → zoom map + set active ═══
  const handleClimbClick = useCallback(
    (idx: number) => {
      setActiveClimbIdx((prev) => (prev === idx ? null : idx));

      // Zoom map to climb bounds
      const climb = climbs[idx];
      if (!climb || !mapInstance || !summary) return;

      const climbPoints = summary.points.slice(climb.startIdx, climb.endIdx + 1);
      if (climbPoints.length < 2) return;

      const lngs = climbPoints.map((p) => p.lon);
      const lats = climbPoints.map((p) => p.lat);

      try {
        mapInstance.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 60, duration: 500 }
        );
      } catch {}
    },
    [climbs, mapInstance, summary]
  );

  // ═══ Custom GPX file setter ═══
  const handleGpxParsed = useCallback(
    (routeSummary: RouteSummary) => {
      handleRouteParsed(routeSummary);
    },
    [handleRouteParsed]
  );

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-6">
      {/* ═══ Header ═══ */}
      <div className="w-full max-w-lg">
        <h1 className="text-lg font-black tracking-wide text-white font-['Space_Grotesk']">
          Analyse de Parcours
        </h1>

        {/* Compact drop zone when route loaded, hero when empty */}
        <div className="mt-3">
          <GpxDropZone
            onRouteParsed={handleGpxParsed}
            variant={summary ? "compact" : "hero"}
            fileName={gpxFileName || undefined}
          />
        </div>
      </div>

      {/* ═══ Analysis content ═══ */}
      {summary && (
        <m.div
          className="mt-4 w-full max-w-lg flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ═══ Map + Elevation sync block ═══ */}
          <CourseMap
            points={summary.points}
            segments={segments}
            centerLat={summary.centerLat}
            centerLon={summary.centerLon}
            climbs={climbs}
            hoveredKm={hoveredKm}
            onHoverKm={setHoveredKm}
            windData={showWind ? windData : null}
            onMapReady={setMapInstance}
          />

          <ElevationProfile
            points={summary.points}
            segments={segments}
            climbs={climbs}
            hoveredKm={hoveredKm}
            onHoverKm={setHoveredKm}
            height={180}
          />

          {/* ═══ Stats row ═══ */}
          <StatsRow
            summary={summary}
            rdi={rdi}
            climbCount={climbs.length}
          />

          {/* ═══ Climbs / Descents panel ═══ */}
          {(climbs.length > 0 || descents.length > 0) && (
            <ClimbsPanel
              climbs={climbs}
              descents={descents}
              activeClimbIdx={activeClimbIdx}
              onClimbClick={handleClimbClick}
              points={summary.points}
            />
          )}

          {/* ═══ Wind & Weather panel ═══ */}
          <WindWeatherPanel
            windData={windData}
            weather={weather}
            showWind={showWind}
            onToggleWind={handleToggleWind}
            loading={loadingWind}
          />
        </m.div>
      )}
    </AnimatedPage>
  );
}
