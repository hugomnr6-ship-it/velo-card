"use client";

import { motion } from "framer-motion";
import type { WeatherData } from "@/types";
import {
  type WindPoint,
  type WindStats,
  type WindVerdict,
  impactColors,
  computeWindStats,
  getWindVerdict,
} from "@/lib/wind-analysis";

interface WindWeatherPanelProps {
  windData: WindPoint[] | null;
  weather: WeatherData | null;
  showWind: boolean;
  onToggleWind: () => void;
  loading: boolean;
}

export default function WindWeatherPanel({
  windData,
  weather,
  showWind,
  onToggleWind,
  loading,
}: WindWeatherPanelProps) {
  const stats = windData && windData.length > 0 ? computeWindStats(windData) : null;
  const verdict = stats ? getWindVerdict(stats) : null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
      {/* ═══ Weather section ═══ */}
      {weather && (
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">
            METEO
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black font-['JetBrains_Mono'] text-white">
              {weather.temperature}&deg;
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-white/60">
                {weather.description || ""}
              </span>
              <span className="text-[10px] text-white/30">
                Vent {weather.windSpeedKmh} km/h {weather.windDirection}
                {weather.windGust ? ` · Rafales ${weather.windGust} km/h` : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Wind toggle ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/30"
          >
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
          </svg>
          <p className="text-[10px] font-bold tracking-wider text-white/30">
            ANALYSE DU VENT
          </p>
        </div>
        <button
          onClick={onToggleWind}
          className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${
            showWind
              ? "bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30"
              : "bg-white/5 text-white/30 border border-white/10"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-transparent" />
              Chargement
            </span>
          ) : showWind ? (
            "Actif"
          ) : (
            "Activer"
          )}
        </button>
      </div>

      {!showWind && !loading && (
        <p className="mt-2 text-[10px] text-white/20 leading-relaxed">
          Analyse la direction et la force du vent sur ton parcours
        </p>
      )}

      {/* ═══ Wind data ═══ */}
      {showWind && stats && windData && windData.length > 0 && (
        <motion.div
          className="mt-3 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Verdict */}
          {verdict && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: verdict.bgColor,
                border: `1px solid ${verdict.color}25`,
              }}
            >
              <p className="text-xs font-bold" style={{ color: verdict.color }}>
                {verdict.text}
              </p>
              <span className="ml-auto text-[10px] text-white/30">
                {stats.headwindPct}% face · {stats.tailwindPct}% dos · {stats.lateralPct}% lateral
              </span>
            </div>
          )}

          {/* Wind bar */}
          <div>
            <div className="flex h-3.5 overflow-hidden rounded-full">
              {windData.map((w, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: impactColors[w.impact] }}
                />
              ))}
            </div>
            <div className="mt-0.5 flex">
              {windData.map((w, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] text-white/15">
                    {Math.round(w.km)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono'] text-white">
                {stats.avgWind}
              </p>
              <p className="text-[7px] text-white/25 leading-tight">
                KM/H MOY.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p className="text-sm font-black font-['JetBrains_Mono'] text-white/60">
                {stats.maxGust}
              </p>
              <p className="text-[7px] text-white/25 leading-tight">RAFALES</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p
                className="text-sm font-black font-['JetBrains_Mono']"
                style={{
                  color:
                    stats.headwindPct > 50
                      ? "#EF4444"
                      : stats.headwindPct > 30
                      ? "#F97316"
                      : "#94A3B8",
                }}
              >
                {stats.headwindPct}%
              </p>
              <p className="text-[7px] text-white/25 leading-tight">FACE</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-center">
              <p
                className="text-sm font-black font-['JetBrains_Mono']"
                style={{
                  color:
                    stats.tailwindPct > 50
                      ? "#22C55E"
                      : stats.tailwindPct > 30
                      ? "#4ADE80"
                      : "#94A3B8",
                }}
              >
                {stats.tailwindPct}%
              </p>
              <p className="text-[7px] text-white/25 leading-tight">DOS</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-3 text-[8px] text-white/20">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Face
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Face leg.
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#94A3B8]" /> Neutre
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Dos
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
