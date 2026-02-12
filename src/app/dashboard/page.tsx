"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import VeloCard from "@/components/VeloCard";
import DownloadButton from "@/components/DownloadButton";
import GpxDropZone from "@/components/GpxDropZone";
import ElevationChart from "@/components/ElevationChart";
import RouteSummaryPanel from "@/components/RouteSummaryPanel";
import WeatherPanel from "@/components/WeatherPanel";
import RdiBadge from "@/components/RdiBadge";
import RegionSelector from "@/components/RegionSelector";
import { DashboardSkeleton } from "@/components/Skeleton";
import Skeleton from "@/components/Skeleton";
import { computeRdi } from "@/lib/rdi";
import type {
  ComputedStats,
  CardTier,
  RouteSummary,
  WeatherData,
  RdiResult,
  FrenchRegion,
} from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Phase 1 state
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [tier, setTier] = useState<CardTier>("bronze");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 2 state
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [rdi, setRdi] = useState<RdiResult | null>(null);

  // Phase 3 state
  const [region, setRegion] = useState<FrenchRegion | null>(null);
  const [regionSaving, setRegionSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.accessToken) {
      syncStats();
    }
  }, [session]);

  // Fetch user region on mount
  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.region) setRegion(data.region);
        })
        .catch(() => {});
    }
  }, [session]);

  async function handleRegionChange(newRegion: FrenchRegion) {
    setRegion(newRegion);
    setRegionSaving(true);
    try {
      await fetch("/api/profile/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: newRegion }),
      });
    } finally {
      setRegionSaving(false);
    }
  }

  // Auto-fetch weather when a GPX route is parsed
  useEffect(() => {
    if (routeSummary) {
      fetchWeather(routeSummary.centerLat, routeSummary.centerLon);
    }
  }, [routeSummary]);

  // Compute RDI when route and/or weather changes
  useEffect(() => {
    if (routeSummary) {
      setRdi(computeRdi(routeSummary, weather));
    }
  }, [routeSummary, weather]);

  async function syncStats() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la synchronisation");
      const data = await res.json();
      setStats({ pac: data.pac, end: data.end, grim: data.grim });
      setTier(data.tier);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function fetchWeather(lat: number, lon: number) {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur météo");
      }
      const data = await res.json();
      setWeather(data);
    } catch (err: any) {
      setWeatherError(err.message);
    } finally {
      setWeatherLoading(false);
    }
  }

  function handleRouteReset() {
    setRouteSummary(null);
    setWeather(null);
    setWeatherError(null);
    setRdi(null);
  }

  // ——— Full page skeleton while session or stats load ———
  if (status === "loading" || !session || (!stats && !error)) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      {/* ——— Phase 1: VeloCard ——— */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {stats && (
        <>
          <VeloCard
            username={session.user.name ?? "Cycliste"}
            avatarUrl={session.user.image ?? null}
            stats={stats}
            tier={tier}
          />
          <DownloadButton tier={tier} />
        </>
      )}

      {/* ——— Phase 2: Analyse de parcours ——— */}
      <section className="mt-8 w-full max-w-2xl">
        {/* Section divider */}
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

        <h2 className="mb-4 text-center text-lg font-bold tracking-wide text-white">
          Analyse de parcours
        </h2>

        <GpxDropZone onRouteParsed={setRouteSummary} />

        {routeSummary && (
          <div className="mt-6 flex flex-col gap-5">
            {/* Route summary stats */}
            <RouteSummaryPanel summary={routeSummary} tier={tier} />

            {/* Elevation profile chart */}
            <ElevationChart points={routeSummary.points} tier={tier} />

            {/* Weather + RDI row */}
            <div className="flex items-start gap-5">
              {/* Weather panel */}
              <div className="flex-1">
                {weatherLoading && (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )}
                {weather && <WeatherPanel weather={weather} tier={tier} />}
                {weatherError && (
                  <p className="text-sm text-red-400">{weatherError}</p>
                )}
              </div>

              {/* RDI badge */}
              {rdi && <RdiBadge rdi={rdi} tier={tier} />}
            </div>

            {/* Reset button */}
            <button
              onClick={handleRouteReset}
              className="mx-auto mt-2 text-sm text-neutral-500 underline hover:text-neutral-300"
            >
              Analyser un autre parcours
            </button>
          </div>
        )}
      </section>

      {/* ——— Phase 3: Social ——— */}
      <section className="mt-8 w-full max-w-2xl">
        {/* Section divider */}
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

        <h2 className="mb-4 text-center text-lg font-bold tracking-wide text-white">
          Communauté
        </h2>

        {/* Region selector */}
        <div className="mb-5 flex items-center gap-3">
          <span className="text-sm text-neutral-400">Ma région :</span>
          <RegionSelector
            value={region}
            onChange={handleRegionChange}
            disabled={regionSaving}
          />
          {regionSaving && (
            <span className="text-xs text-neutral-500">Sauvegarde...</span>
          )}
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/races"
            className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-6 transition hover:border-neutral-600 hover:bg-neutral-800 active:scale-95"
          >
            <span className="text-3xl">🏁</span>
            <span className="text-sm font-semibold text-white group-hover:text-white/90">
              Courses
            </span>
            <span className="text-xs text-neutral-500">
              Crée et rejoins des courses
            </span>
          </Link>

          <Link
            href="/leaderboard"
            className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-6 transition hover:border-neutral-600 hover:bg-neutral-800 active:scale-95"
          >
            <span className="text-3xl">🏆</span>
            <span className="text-sm font-semibold text-white group-hover:text-white/90">
              Classement
            </span>
            <span className="text-xs text-neutral-500">
              Top hebdo de ta région
            </span>
          </Link>
        </div>
      </section>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 text-sm text-neutral-500 underline hover:text-neutral-300"
      >
        Se déconnecter
      </button>
    </main>
  );
}
