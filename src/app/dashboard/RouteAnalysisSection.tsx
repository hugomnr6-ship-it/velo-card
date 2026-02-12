"use client";

import { useState, useEffect } from "react";
import GpxDropZone from "@/components/GpxDropZone";
import ElevationChart from "@/components/ElevationChart";
import RouteSummaryPanel from "@/components/RouteSummaryPanel";
import WeatherPanel from "@/components/WeatherPanel";
import RdiBadge from "@/components/RdiBadge";
import Skeleton from "@/components/Skeleton";
import { computeRdi } from "@/lib/rdi";
import type { CardTier, RouteSummary, WeatherData, RdiResult } from "@/types";

interface RouteAnalysisSectionProps {
  tier: CardTier;
}

export default function RouteAnalysisSection({
  tier,
}: RouteAnalysisSectionProps) {
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [rdi, setRdi] = useState<RdiResult | null>(null);

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

  return (
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
  );
}
