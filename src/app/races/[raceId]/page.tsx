"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import ParticipantRow from "@/components/ParticipantRow";
import ResultRow from "@/components/ResultRow";
import RaceResultsForm from "@/components/RaceResultsForm";
import AnimatedPage from "@/components/AnimatedPage";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { useToast } from "@/contexts/ToastContext";
import Skeleton from "@/components/Skeleton";
import { FlagIcon } from "@/components/icons/TabIcons";
import type { RaceDetailWithResults, GpxPoint } from "@/types";
import type { GradientSegment, ClimbSegment } from "@/lib/gpx-analysis";
import {
  computeSegmentGradients,
  identifyClimbs,
} from "@/lib/gpx-analysis";

// Dynamic import for map (heavy)
const CourseMap = dynamic(() => import("@/components/CourseMap"), { ssr: false });
const ElevationProfile = dynamic(() => import("@/components/ElevationProfile"), { ssr: false });
const WindOverlay = dynamic(() => import("@/components/WindOverlay"), { ssr: false });

// ——— Federation badge colors ———
const fedColors: Record<string, { bg: string; text: string }> = {
  FFC: { bg: "bg-blue-500/15", text: "text-blue-400" },
  UFOLEP: { bg: "bg-green-500/15", text: "text-green-400" },
  FSGT: { bg: "bg-orange-500/15", text: "text-orange-400" },
  OTHER: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// ——— Weather icon mapping (WMO codes) ———
function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code >= 95) return "⛈️";
  return "☁️";
}

// ——— Wind direction to compass ———
function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

// ——— Forecast types ———
interface Forecast {
  date: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
  description: string;
  hourly: {
    hour: number;
    temperature: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    windGusts: number | null;
    precipitation: number | null;
    weatherCode: number;
  }[];
}

export default function RaceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const raceId = params.raceId as string;
  const { toast } = useToast();

  const [race, setRace] = useState<RaceDetailWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [gpxUploading, setGpxUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchRace = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}`);
      if (res.ok) {
        setRace(await res.json());
      } else {
        router.replace("/races");
      }
    } finally {
      setLoading(false);
    }
  }, [raceId, router]);

  useEffect(() => {
    if (session && raceId) fetchRace();
  }, [session, raceId, fetchRace]);

  // ——— GPX Analysis ———
  const gpxPoints: GpxPoint[] = useMemo(() => {
    if (!race?.gpx_data?.points) return [];
    return race.gpx_data.points;
  }, [race]);

  const hasGpx = gpxPoints.length > 2;

  const segments: GradientSegment[] = useMemo(
    () => (hasGpx ? computeSegmentGradients(gpxPoints) : []),
    [gpxPoints, hasGpx]
  );

  const climbs: ClimbSegment[] = useMemo(
    () => (hasGpx ? identifyClimbs(gpxPoints) : []),
    [gpxPoints, hasGpx]
  );

  const routeStats = useMemo(() => {
    if (!hasGpx) return null;
    const totalDist = gpxPoints[gpxPoints.length - 1].distFromStart;
    const maxEle = Math.max(...gpxPoints.map((p) => p.ele));
    const minEle = Math.min(...gpxPoints.map((p) => p.ele));
    let dPlus = 0;
    for (let i = 1; i < gpxPoints.length; i++) {
      const diff = gpxPoints[i].ele - gpxPoints[i - 1].ele;
      if (diff > 0) dPlus += diff;
    }
    const centerLat = gpxPoints[Math.floor(gpxPoints.length / 2)].lat;
    const centerLon = gpxPoints[Math.floor(gpxPoints.length / 2)].lon;
    return { totalDist, maxEle, minEle, dPlus: Math.round(dPlus), centerLat, centerLon };
  }, [gpxPoints, hasGpx]);

  // ——— Fetch weather forecast ———
  useEffect(() => {
    if (!race || !race.date) return;
    // Only fetch for races within 14 days
    const raceDate = new Date(race.date);
    const now = new Date();
    const diffDays = Math.floor((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < -1 || diffDays > 14) return;

    // Need coordinates: either from GPX or approximate from location string
    let lat = routeStats?.centerLat;
    let lon = routeStats?.centerLon;
    if (!lat || !lon) {
      // Default to center of France if no GPX
      lat = 46.6;
      lon = 2.2;
    }

    setForecastLoading(true);
    fetch("/api/weather/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, date: race.date }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setForecast(data); })
      .catch(() => {})
      .finally(() => setForecastLoading(false));
  }, [race, routeStats]);

  // ——— Sorted participants by OVR ———
  const sortedParticipants = useMemo(() => {
    if (!race) return [];
    return [...race.participants].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  }, [race]);

  // ——— Actions ———
  async function handleJoin() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/join`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de l'inscription");
      toast("Inscription confirmee !", "success");
      await fetchRace();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/leave`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la desinscription");
      toast("Desinscription effectuee", "info");
      await fetchRace();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette course ?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast("Course supprimee", "info");
      router.replace("/races");
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // ——— Loading state ———
  if (status === "loading" || !session || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="mb-2 h-8 w-3/4" />
          <Skeleton className="mb-4 h-4 w-1/2" />
          <div className="mb-4 flex gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-16 rounded-md" />)}
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <Skeleton className="mb-4 h-[300px] w-full rounded-2xl" />
          <Skeleton className="mb-4 h-[200px] w-full rounded-2xl" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />)}
        </div>
      </main>
    );
  }

  if (!race) return null;

  const dateStr = new Date(race.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fed = fedColors[race.federation] || fedColors.OTHER;
  const isPast = new Date(race.date) < new Date();
  const distKm = race.distance_km || (routeStats ? Math.round(routeStats.totalDist * 10) / 10 : null);
  const elevGain = race.elevation_gain || routeStats?.dPlus || null;

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      <div className="w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/races"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-white/80 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </Link>

        {/* ════════ HEADER ════════ */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#1A1A2E]/60 p-5">
          {/* Badges row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${fed.bg} ${fed.text}`}>
              {race.federation}
            </span>
            {race.category && race.category !== "Seniors" && (
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8]">
                {race.category}
              </span>
            )}
            {race.gender && race.gender !== "MIXTE" && (
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8]">
                {race.gender === "H" ? "Hommes" : "Femmes"}
              </span>
            )}
            {race.rdi_score && (
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                race.rdi_score >= 7 ? "bg-red-500/15 text-red-400" :
                race.rdi_score >= 4 ? "bg-orange-500/15 text-orange-400" :
                "bg-green-500/15 text-green-400"
              }`}>
                RDI {race.rdi_score}/10
              </span>
            )}
            {race.is_official && (
              <span className="rounded-md bg-[#6366F1]/15 px-2 py-0.5 text-[10px] font-bold text-[#6366F1]">
                Officielle
              </span>
            )}
          </div>

          {/* Title & info */}
          <h1 className="text-xl font-bold text-white leading-tight">{race.name}</h1>
          <div className="mt-2 flex flex-col gap-1">
            <p className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateStr}
            </p>
            <p className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {race.location}
              {race.department && <span className="text-[#475569]">({race.department})</span>}
            </p>
          </div>

          {/* Creator */}
          {race.creator && (
            <div className="mt-3 flex items-center gap-2">
              {race.creator.avatar_url ? (
                <img src={race.creator.avatar_url} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-[#22223A]" />
              )}
              <span className="text-[11px] text-[#64748B]">
                Organisee par {race.creator.username}
              </span>
            </div>
          )}

          {race.description && (
            <p className="mt-3 text-sm text-white/70 leading-relaxed">{race.description}</p>
          )}
        </div>

        {/* ════════ STATS ROW ════════ */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {distKm && (
            <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3">
              <span className="text-lg font-black text-white">{distKm}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">KM</span>
            </div>
          )}
          {elevGain && (
            <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3">
              <span className="text-lg font-black text-white">{elevGain}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">D+</span>
            </div>
          )}
          {climbs.length > 0 && (
            <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3">
              <span className="text-lg font-black text-white">{climbs.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                {climbs.length === 1 ? "COL" : "COLS"}
              </span>
            </div>
          )}
          {routeStats && (
            <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3">
              <span className="text-lg font-black text-white">{Math.round(routeStats.maxEle)}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">ALT MAX</span>
            </div>
          )}
          {!distKm && !elevGain && climbs.length === 0 && !routeStats && (
            <div className="col-span-4 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/40 p-4 text-center">
              <p className="text-xs text-[#475569]">Pas de donnees de parcours disponibles</p>
            </div>
          )}
        </div>

        {/* ════════ ACTION BUTTONS ════════ */}
        <div className="mt-4 flex gap-3">
          {!race.is_participant && !race.is_creator && !isPast && (
            <motion.button
              onClick={handleJoin}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-[#6366F1] py-3 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              whileTap={{ scale: 0.97 }}
            >
              {actionLoading ? "..." : "Je participe"}
            </motion.button>
          )}
          {race.is_participant && !race.is_creator && (
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {actionLoading ? "..." : "Se desinscrire"}
            </button>
          )}
          {race.is_participant && (
            <div className="flex items-center gap-2 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm font-semibold text-[#22C55E]">Inscrit</span>
            </div>
          )}
          {race.is_creator && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>

        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ════════ COURSE MAP ════════ */}
        {hasGpx && routeStats && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#64748B]">
              Parcours
            </h2>
            <CourseMap
              points={gpxPoints}
              segments={segments}
              centerLat={routeStats.centerLat}
              centerLon={routeStats.centerLon}
              onMapReady={setMapInstance}
            />
          </section>
        )}

        {/* ════════ ELEVATION PROFILE ════════ */}
        {hasGpx && (
          <section className="mb-6">
            <ElevationProfile points={gpxPoints} climbs={climbs} />
          </section>
        )}

        {/* ════════ WIND OVERLAY ════════ */}
        {hasGpx && (
          <section className="mb-6">
            <WindOverlay
              points={gpxPoints}
              map={mapInstance}
              targetDate={race.date}
            />
          </section>
        )}

        {/* ════════ WEATHER FORECAST ════════ */}
        {forecast && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#64748B]">
              Meteo jour J
            </h2>
            <div className="rounded-2xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4">
              {/* Main weather */}
              <div className="flex items-center gap-4">
                <span className="text-4xl">{weatherIcon(forecast.weatherCode)}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{forecast.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#94A3B8]">
                    <span>{forecast.temperatureMin}° / {forecast.temperatureMax}°C</span>
                    <span>💨 {forecast.windSpeed} km/h</span>
                    {forecast.windGusts > 0 && (
                      <span className="text-[#F97316]">Raf. {forecast.windGusts}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                    <span>Vent {degToCompass(forecast.windDirection)}</span>
                    {forecast.precipitation > 0 && (
                      <span className="text-blue-400">🌧️ {forecast.precipitation} mm</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hourly timeline */}
              {forecast.hourly.length > 0 && (
                <div className="mt-4 overflow-x-auto scrollbar-none">
                  <div className="flex gap-2 pb-1">
                    {forecast.hourly.map((h) => (
                      <div
                        key={h.hour}
                        className="flex flex-shrink-0 flex-col items-center gap-1 rounded-lg bg-white/[0.03] px-2.5 py-2"
                      >
                        <span className="text-[10px] font-bold text-[#64748B]">{h.hour}h</span>
                        <span className="text-sm">{weatherIcon(h.weatherCode)}</span>
                        <span className="text-[10px] font-bold text-white">{h.temperature !== null ? `${Math.round(h.temperature)}°` : "-"}</span>
                        <span className="text-[9px] text-[#475569]">
                          {h.windSpeed !== null ? `${Math.round(h.windSpeed)}` : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {forecastLoading && (
          <Skeleton className="mb-6 h-32 w-full rounded-2xl" />
        )}

        {/* ════════ DIFFICULT PASSAGES ════════ */}
        {climbs.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#64748B]">
              Passages difficiles ({climbs.length})
            </h2>
            <div className="flex flex-col gap-2">
              {climbs.map((climb, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                        climb.avgGradient >= 8 ? "bg-red-500/15 text-red-400" :
                        climb.avgGradient >= 5 ? "bg-orange-500/15 text-orange-400" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>
                        {climb.avgGradient}%
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{climb.name}</p>
                        <p className="text-[10px] text-[#64748B]">
                          km {climb.distStart.toFixed(1)} → {climb.distEnd.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-right">
                      <div>
                        <p className="text-xs font-bold text-white">{climb.length} km</p>
                        <p className="text-[9px] text-[#475569]">Distance</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{climb.elevGain} m</p>
                        <p className="text-[9px] text-[#475569]">D+</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-400">{climb.maxGradient}%</p>
                        <p className="text-[9px] text-[#475569]">Max</p>
                      </div>
                    </div>
                  </div>
                  {/* Gradient bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (climb.avgGradient / 15) * 100)}%`,
                        background: climb.avgGradient >= 8 ? "#EF4444" : climb.avgGradient >= 5 ? "#F97316" : "#EAB308",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ════════ RESULTS SECTION ════════ */}
        {race.results_published && race.results && race.results.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
                Resultats ({race.results.length})
              </h2>
              {race.is_creator && (
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90"
                >
                  {showEditForm ? "Fermer" : "Modifier"}
                </button>
              )}
            </div>

            {showEditForm && race.is_creator && (
              <div className="mb-4">
                <RaceResultsForm
                  raceId={raceId}
                  existingResults={race.results}
                  existingRaceTime={race.race_time}
                  existingAvgSpeed={race.avg_speed}
                  onPublished={() => {
                    setShowEditForm(false);
                    fetchRace();
                  }}
                />
              </div>
            )}

            {/* Race time & speed */}
            {(race.race_time > 0 || race.avg_speed > 0) && (
              <div className="mb-3 flex flex-wrap gap-3">
                {race.race_time > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/80 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#94A3B8]">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs text-[#94A3B8]">Temps</span>
                    <span className="text-sm font-bold text-white">
                      {(() => {
                        const h = Math.floor(race.race_time / 3600);
                        const m = Math.floor((race.race_time % 3600) / 60);
                        const s = race.race_time % 60;
                        if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
                        return `${m}m${s.toString().padStart(2, "0")}s`;
                      })()}
                    </span>
                  </div>
                )}
                {race.avg_speed > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/80 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#94A3B8]">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="text-xs text-[#94A3B8]">Vitesse moy.</span>
                    <span className="text-sm font-bold text-white">{race.avg_speed} km/h</span>
                  </div>
                )}
              </div>
            )}

            <AnimatedList className="flex flex-col gap-2">
              {race.results.map((r) => (
                <AnimatedListItem key={`result-${r.position}`}>
                  <ResultRow result={r} currentUserId={session.user.id} />
                </AnimatedListItem>
              ))}
            </AnimatedList>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </section>
        )}

        {/* Results form (creator, first time) */}
        {race.is_creator && !race.results_published && isPast && (
          <section className="mb-6">
            <RaceResultsForm
              raceId={raceId}
              existingRaceTime={race.race_time}
              existingAvgSpeed={race.avg_speed}
              onPublished={fetchRace}
            />
            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </section>
        )}

        {/* ════════ FAVORITES / STARTLIST ════════ */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#64748B]">
            {isPast ? "Participants" : "Favoris au depart"} ({race.participants.length})
          </h2>

          {race.participants.length === 0 ? (
            <EmptyState
              icon={<FlagIcon size={36} />}
              title="Aucun participant"
              description="Sois le premier a t'inscrire !"
            />
          ) : (
            <AnimatedList className="flex flex-col gap-2">
              {sortedParticipants.map((p, i) => (
                <AnimatedListItem key={p.user_id}>
                  <ParticipantRow participant={p} index={i} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </section>

        {/* ════════ GPX CONTRIBUTION ════════ */}
        {!hasGpx && (
          <section className="mb-6">
            <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#1A1A2E]/30 p-6 text-center">
              <div className="mb-3 flex justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#475569]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#94A3B8]">Pas de GPX disponible</p>
              <p className="mt-1 text-xs text-[#475569]">
                Contribue le parcours GPX pour aider la communaute !
              </p>
              <label
                className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-2 text-xs font-semibold text-[#6366F1] transition hover:bg-[#6366F1]/20 ${gpxUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {gpxUploading ? "Upload en cours..." : "Soumettre un GPX"}
                <input
                  type="file"
                  accept=".gpx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setGpxUploading(true);
                    try {
                      const text = await file.text();
                      const res = await fetch(`/api/races/${raceId}/gpx`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gpx_xml: text }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        toast(`GPX ajoute ! ${data.stats.distanceKm} km, D+ ${data.stats.elevationGain}m`, "success");
                        await fetchRace();
                      } else {
                        const err = await res.json();
                        toast(err.error || "Erreur upload GPX", "error");
                      }
                    } catch {
                      toast("Erreur lors de l'upload", "error");
                    } finally {
                      setGpxUploading(false);
                    }
                  }}
                />
              </label>
            </div>
          </section>
        )}

        {/* ════════ SOURCE LINK ════════ */}
        {race.source_url && (
          <div className="mb-6 text-center">
            <a
              href={race.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#475569] hover:text-[#94A3B8] transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Source officielle
            </a>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
