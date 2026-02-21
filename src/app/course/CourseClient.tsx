"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import GpxDropZone from "@/components/GpxDropZone";
import { useRoutes } from "@/hooks/useRoutes";
import { useToast } from "@/contexts/ToastContext";
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
  const searchParams = useSearchParams();

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

  // ═══ Sauvegarde parcours ═══
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);
  const { createRoute } = useRoutes();
  const { toast } = useToast();

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

  // ═══ Auto-load GPX depuis une course (query param race_id) ═══
  useEffect(() => {
    const raceId = searchParams.get("race_id");
    if (!raceId || summary) return;

    async function loadFromRace() {
      try {
        const res = await fetch(`/api/races/${raceId}`);
        if (!res.ok) return;
        const race = await res.json();
        if (!race.gpx_data?.points || race.gpx_data.points.length < 2) return;

        const routeSummary: RouteSummary = {
          points: race.gpx_data.points,
          totalDistanceKm: race.gpx_data.totalDistanceKm,
          totalElevationGain: race.gpx_data.totalElevationGain,
          maxElevation: race.gpx_data.maxElevation,
          minElevation: race.gpx_data.minElevation,
          centerLat: race.gpx_data.centerLat,
          centerLon: race.gpx_data.centerLon,
        };
        setGpxFileName(race.name || "Course GPX");
        handleRouteParsed(routeSummary);
      } catch { /* erreur silencieuse */ }
    }
    loadFromRace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

          {/* ═══ Bouton sauvegarder ═══ */}
          {!saved ? (
            <button
              onClick={() => {
                setSaveName(gpxFileName?.replace(/\.gpx$/i, "") || "");
                setShowSaveModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/10 py-3 text-sm font-bold text-[#818CF8] transition hover:bg-[#6366F1]/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Sauvegarder ce parcours
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
              <span className="text-sm font-medium text-green-400">Parcours sauvegarde</span>
              <Link
                href="/parcours"
                className="text-xs font-bold text-[#6366F1] transition hover:text-[#818CF8]"
              >
                Voir mes parcours
              </Link>
            </div>
          )}
        </m.div>
      )}

      {/* ═══ Modal de sauvegarde ═══ */}
      {showSaveModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111827] p-5"
          >
            <h3 className="mb-4 text-base font-bold text-white">Sauvegarder le parcours</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nom du parcours"
              className="mb-4 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#6366F1]/40"
              autoFocus
            />
            <div className="mb-4 flex gap-3 text-xs text-[#64748B]">
              <span>{summary.totalDistanceKm.toFixed(1)} km</span>
              <span>D+ {summary.totalElevationGain}m</span>
              {rdi && <span>RDI {rdi.score.toFixed(1)}</span>}
              {climbs.length > 0 && <span>{climbs.length} col(s)</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm font-medium text-[#94A3B8] transition hover:bg-white/[0.04]"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!saveName.trim()) return;
                  try {
                    await createRoute.mutateAsync({
                      name: saveName.trim(),
                      distance_km: summary.totalDistanceKm,
                      elevation_gain: summary.totalElevationGain,
                      rdi_score: rdi?.score ?? null,
                      climb_count: climbs.length,
                      center_lat: summary.centerLat,
                      center_lng: summary.centerLon,
                    });
                    setShowSaveModal(false);
                    setSaved(true);
                    toast("Parcours sauvegarde !", "success");
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Erreur";
                    toast(message, "error");
                  }
                }}
                disabled={!saveName.trim() || createRoute.isPending}
                className="flex-1 rounded-lg bg-[#6366F1] py-2.5 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
              >
                {createRoute.isPending ? "..." : "Sauvegarder"}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatedPage>
  );
}
