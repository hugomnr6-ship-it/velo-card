"use client";

import { useState } from "react";
import { m } from "framer-motion";
import type { ClimbSegment, DescentSegment } from "@/lib/gpx-analysis";
import type { GpxPoint } from "@/types";
import ClimbDetailView from "./ClimbDetailView";

interface ClimbsPanelProps {
  climbs: ClimbSegment[];
  descents: DescentSegment[];
  activeClimbIdx: number | null;
  onClimbClick: (idx: number) => void;
  points?: GpxPoint[];
}

function gradientColor(pct: number): string {
  if (pct >= 12) return "#9333EA";
  if (pct >= 8) return "#EF4444";
  if (pct >= 5) return "#F97316";
  if (pct >= 3) return "#EAB308";
  return "#22C55E";
}

export default function ClimbsPanel({
  climbs,
  descents,
  activeClimbIdx,
  onClimbClick,
  points,
}: ClimbsPanelProps) {
  const [tab, setTab] = useState<"climbs" | "descents">("climbs");

  // Show detail view when a climb is selected and points are available
  if (activeClimbIdx !== null && points && climbs[activeClimbIdx]) {
    return (
      <ClimbDetailView
        climb={climbs[activeClimbIdx]}
        points={points}
        onBack={() => onClimbClick(activeClimbIdx)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTab("climbs")}
          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider transition ${
            tab === "climbs"
              ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
              : "text-white/30 border border-white/[0.06]"
          }`}
        >
          MONTEES ({climbs.length})
        </button>
        <button
          onClick={() => setTab("descents")}
          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider transition ${
            tab === "descents"
              ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20"
              : "text-white/30 border border-white/[0.06]"
          }`}
        >
          DESCENTES ({descents.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[360px] overflow-y-auto flex flex-col gap-2 pr-1">
        {tab === "climbs" && climbs.length === 0 && (
          <p className="py-4 text-center text-xs text-white/20">
            Parcours plat — aucune montee significative
          </p>
        )}

        {tab === "climbs" &&
          climbs.map((climb, i) => {
            const active = activeClimbIdx === i;
            const color = gradientColor(climb.avgGradient);
            return (
              <m.button
                key={i}
                onClick={() => onClimbClick(i)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  active
                    ? "border-[#6366F1]/30 bg-white/[0.04]"
                    : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]"
                }`}
                style={active ? { borderLeftWidth: 3, borderLeftColor: "#6366F1" } : {}}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{climb.name}</span>
                  <span className="text-[9px] font-mono text-white/25">
                    km {Math.round(climb.distStart * 10) / 10} &rarr; {Math.round(climb.distEnd * 10) / 10}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-center">
                    <p className="text-[11px] font-black font-['JetBrains_Mono'] text-white">
                      {climb.length}
                    </p>
                    <p className="text-[7px] text-white/25">KM</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-center">
                    <p className="text-[11px] font-black font-['JetBrains_Mono'] text-white">
                      {climb.elevGain}
                    </p>
                    <p className="text-[7px] text-white/25">D+</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-center">
                    <p
                      className="text-[11px] font-black font-['JetBrains_Mono']"
                      style={{ color }}
                    >
                      {climb.avgGradient}%
                    </p>
                    <p className="text-[7px] text-white/25">MOY.</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-center">
                    <p
                      className="text-[11px] font-black font-['JetBrains_Mono']"
                      style={{ color: climb.maxGradient >= 10 ? "#EF4444" : "#F97316" }}
                    >
                      {climb.maxGradient}%
                    </p>
                    <p className="text-[7px] text-white/25">MAX</p>
                  </div>
                </div>

                {/* Difficulty bar */}
                <div className="mt-2 h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, climb.avgGradient * 8)}%`,
                      background: color,
                    }}
                  />
                </div>
              </m.button>
            );
          })}

        {tab === "descents" && descents.length === 0 && (
          <p className="py-4 text-center text-xs text-white/20">
            Aucune descente significative
          </p>
        )}

        {tab === "descents" &&
          descents.map((d, i) => (
            <m.div
              key={i}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#3B82F6]">
                  Descente {i + 1}
                </span>
                <span className="text-[9px] font-mono text-white/25">
                  km {Math.round(d.distStart * 10) / 10} &rarr; {Math.round(d.distEnd * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/40">
                <span>{d.length} km</span>
                <span>{d.elevDrop}m</span>
                <span className="text-[#3B82F6]">{d.avgGradient}%</span>
              </div>
            </m.div>
          ))}
      </div>
    </div>
  );
}
