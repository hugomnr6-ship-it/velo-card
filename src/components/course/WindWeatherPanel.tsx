"use client";

import { m } from "framer-motion";
import type { WeatherData } from "@/types";
import {
  type WindPoint,
  type WindStats,
  type WindImpact,
  impactColors,
  impactLabels,
  computeWindStats,
} from "@/lib/wind-analysis";

interface WindWeatherPanelProps {
  windData: WindPoint[] | null;
  weather: WeatherData | null;
  showWind: boolean;
  onToggleWind: () => void;
  loading: boolean;
}

/* ═══ Verdict config ═══ */
type VerdictLevel = "very_unfavorable" | "unfavorable" | "neutral" | "favorable" | "very_favorable";

const verdictConfig: Record<
  VerdictLevel,
  { emoji: string; label: string; color: string; bg: string; border: string; advice: string }
> = {
  very_unfavorable: {
    emoji: "\u{1F534}",
    label: "VENT TRES DEFAVORABLE",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.15)",
    advice: "Vent de face fort sur la majorite du parcours. Economise ton energie au depart.",
  },
  unfavorable: {
    emoji: "\u{1F7E0}",
    label: "VENT DEFAVORABLE",
    color: "#F97316",
    bg: "rgba(249,115,22,0.06)",
    border: "rgba(249,115,22,0.15)",
    advice: "Tu auras le vent de face sur une bonne partie du parcours. Adapte ton effort.",
  },
  neutral: {
    emoji: "\u26AA",
    label: "VENT NEUTRE",
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.15)",
    advice: "Le vent ne sera pas un facteur decisif aujourd'hui. Conditions neutres.",
  },
  favorable: {
    emoji: "\u{1F7E2}",
    label: "VENT FAVORABLE",
    color: "#4ADE80",
    bg: "rgba(74,222,128,0.06)",
    border: "rgba(74,222,128,0.15)",
    advice: "Bonne nouvelle : vent de dos sur une bonne partie du parcours. Profite des portions aidees.",
  },
  very_favorable: {
    emoji: "\u{1F7E2}",
    label: "VENT TRES FAVORABLE",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.15)",
    advice: "Conditions ideales ! Le vent te poussera sur la majorite du parcours.",
  },
};

function getVerdictLevel(stats: WindStats): VerdictLevel {
  if (stats.headwindPct >= 60) return "very_unfavorable";
  if (stats.headwindPct >= 40) return "unfavorable";
  if (stats.tailwindPct >= 60) return "very_favorable";
  if (stats.tailwindPct >= 40) return "favorable";
  return "neutral";
}

export default function WindWeatherPanel({
  windData,
  weather,
  showWind,
  onToggleWind,
  loading,
}: WindWeatherPanelProps) {
  const stats = windData && windData.length > 0 ? computeWindStats(windData) : null;
  const level = stats ? getVerdictLevel(stats) : null;
  const verdict = level ? verdictConfig[level] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* ═══ Weather section ═══ */}
      {weather && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">METEO</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black font-['JetBrains_Mono'] text-white">
              {weather.temperature}&deg;
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-white/60 capitalize">{weather.description || ""}</span>
              <span className="text-[10px] text-white/30">
                Vent {weather.windSpeedKmh} km/h {weather.windDirection}
                {weather.windGust ? ` · Rafales ${weather.windGust} km/h` : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Wind section ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
        {/* Header + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">💨</span>
            <p className="text-[10px] font-bold tracking-wider text-white/30">
              ANALYSE DU VENT
            </p>
          </div>
          {showWind && stats && (
            <button
              onClick={onToggleWind}
              className="rounded-full bg-white/5 px-2.5 py-0.5 text-[9px] font-bold text-white/30 border border-white/10 transition active:scale-95"
            >
              Masquer
            </button>
          )}
        </div>

        {/* ═══ Inactive state ═══ */}
        {!showWind && !loading && (
          <div className="mt-3 flex flex-col items-center py-4">
            <p className="text-xs text-white/40 text-center leading-relaxed mb-4">
              Visualise le vent de face, de dos et lateral<br />
              tout au long de ton parcours.
            </p>
            <button
              onClick={onToggleWind}
              className="flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-bold text-white transition active:scale-95 hover:bg-[#5558E6]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Analyser le vent
            </button>
            <p className="mt-3 text-[9px] text-white/15">
              Donnees : Open-Meteo (prevision 16 jours)
            </p>
          </div>
        )}

        {/* ═══ Loading state ═══ */}
        {loading && (
          <div role="status" className="mt-4 flex items-center justify-center gap-2 py-6">
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
            <span className="text-xs text-white/40">Analyse en cours...</span>
          </div>
        )}

        {/* ═══ Active state — wind data ═══ */}
        {showWind && stats && windData && windData.length > 0 && verdict && (
          <m.div
            className="mt-3 space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ─── Zone 1: Verdict ─── */}
            <div
              className="rounded-xl p-3.5"
              style={{ backgroundColor: verdict.bg, border: `1px solid ${verdict.border}` }}
            >
              <p className="text-xs font-black tracking-wide mb-1" style={{ color: verdict.color }}>
                {verdict.emoji} {verdict.label}
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                {verdict.advice}
              </p>

              {/* Tricolor bar */}
              <div className="mt-3">
                <div className="flex h-2 overflow-hidden rounded-full">
                  {stats.headwindPct > 0 && (
                    <div
                      className="transition-all duration-500"
                      style={{ width: `${stats.headwindPct}%`, backgroundColor: "#EF4444" }}
                    />
                  )}
                  {stats.lateralPct > 0 && (
                    <div
                      className="transition-all duration-500"
                      style={{ width: `${stats.lateralPct}%`, backgroundColor: "#64748B" }}
                    />
                  )}
                  {stats.tailwindPct > 0 && (
                    <div
                      className="transition-all duration-500"
                      style={{ width: `${stats.tailwindPct}%`, backgroundColor: "#22C55E" }}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-[11px] font-mono font-medium text-[#EF4444]">
                    Face {stats.headwindPct}%
                  </span>
                  <span className="text-[11px] font-mono font-medium text-[#64748B]">
                    Lateral {stats.lateralPct}%
                  </span>
                  <span className="text-[11px] font-mono font-medium text-[#22C55E]">
                    Dos {stats.tailwindPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Zone 2: 4 chiffres cles ─── */}
            <div className="grid grid-cols-4 gap-2">
              <StatBox
                icon="💨"
                value={`${stats.avgWind}`}
                unit="km/h"
                label="MOY."
              />
              <StatBox
                icon="💨"
                value={`${stats.maxGust}`}
                unit="km/h"
                label="MAX"
              />
              <StatBox
                icon="↗"
                value={`${stats.headwindPct}%`}
                label="FACE"
                valueColor={stats.headwindPct > 50 ? "#EF4444" : stats.headwindPct > 30 ? "#F97316" : "#94A3B8"}
              />
              <StatBox
                icon="↙"
                value={`${stats.tailwindPct}%`}
                label="DOS"
                valueColor={stats.tailwindPct > 50 ? "#22C55E" : stats.tailwindPct > 30 ? "#4ADE80" : "#94A3B8"}
              />
            </div>

            {/* ─── Zone 3: Timeline par section ─── */}
            <div>
              <p className="text-[9px] font-bold tracking-wider text-white/20 mb-2">
                VENT PAR SECTION
              </p>
              <div className="flex gap-0.5">
                {windData.map((w, i) => {
                  const maxSpeed = Math.max(...windData.map((p) => p.windSpeed), 1);
                  const barHeight = 20 + (w.windSpeed / maxSpeed) * 40;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      {/* Speed label */}
                      <span className="text-[8px] font-mono font-bold text-white/30">
                        {Math.round(w.windSpeed)}
                      </span>
                      {/* Bar */}
                      <div
                        className="w-full rounded-sm transition-all duration-300"
                        style={{
                          height: barHeight,
                          backgroundColor: impactColors[w.impact],
                          opacity: 0.8,
                        }}
                      />
                      {/* Direction label */}
                      <span
                        className="text-[7px] font-bold"
                        style={{ color: impactColors[w.impact] }}
                      >
                        {w.impact === "very_unfavorable" || w.impact === "unfavorable"
                          ? "Face"
                          : w.impact === "favorable" || w.impact === "very_favorable"
                          ? "Dos"
                          : "Lat."}
                      </span>
                      {/* KM label */}
                      <span className="text-[7px] text-white/15 font-mono">
                        {Math.round(w.km)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </m.div>
        )}
      </div>
    </div>
  );
}

/* ═══ Small stat box ═══ */
function StatBox({
  icon,
  value,
  unit,
  label,
  valueColor,
}: {
  icon: string;
  value: string;
  unit?: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl bg-[#16161F] border border-white/[0.06] p-2.5 text-center">
      <span className="text-[10px]">{icon}</span>
      <p
        className="text-lg font-black font-['JetBrains_Mono'] leading-tight"
        style={{ color: valueColor || "#fff" }}
      >
        {value}
      </p>
      {unit && <p className="text-[8px] text-white/20">{unit}</p>}
      <p className="text-[8px] font-bold tracking-wider text-white/30 mt-0.5">{label}</p>
    </div>
  );
}
