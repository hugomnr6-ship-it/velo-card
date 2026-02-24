"use client";

import { useState } from "react";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";
import VeloCard from "./VeloCard";
import RadarChart from "./RadarChart";
import { tierConfig, tierBorderColors, tierDividerColors } from "./VeloCard";

interface FlipCardProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges?: Badge[];
  clubs?: ClubInfo[];
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

const STAT_LABELS = ["VIT", "MON", "TEC", "SPR", "END", "PUI"] as const;

function getStatValues(stats: ComputedStats): number[] {
  return [stats.pac, stats.mon, stats.val, stats.spr, stats.end, stats.res];
}

export default function FlipCard({
  username,
  avatarUrl,
  stats,
  tier,
  badges = [],
  clubs = [],
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const config = tierConfig[tier];
  const accent = tierAccentHex[tier];
  const statValues = getStatValues(stats);

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative transition-transform duration-700"
        style={{
          width: 260,
          height: 380,
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front — VeloCard */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div style={{ transform: "scale(0.65)", transformOrigin: "top left", width: 400, height: 585 }}>
            <VeloCard
              username={username}
              avatarUrl={avatarUrl}
              stats={stats}
              tier={tier}
              badges={badges}
              clubs={clubs}
            />
          </div>
        </div>

        {/* Back — Radar + stats */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl border-[1.5px] bg-gradient-to-b ${config.bg} ${tierBorderColors[tier]}`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Scan-lines */}
          <div className="scan-lines pointer-events-none absolute inset-0 z-10 rounded-2xl" />

          <div className="relative z-20 flex h-full flex-col items-center px-4 pt-4 pb-3">
            {/* Header */}
            <span className="text-[9px] font-bold tracking-[0.3em] text-white/40">
              ANALYSE
            </span>

            {/* Radar chart */}
            <div className="mt-2">
              <RadarChart stats={stats} tier={tier} size={160} />
            </div>

            {/* Divider */}
            <div
              className={`mt-1 h-px w-full bg-gradient-to-r ${tierDividerColors[tier]}`}
            />

            {/* Stat bars */}
            <div className="mt-2 flex w-full flex-col gap-1.5">
              {STAT_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-7 text-[9px] font-bold text-white/40 font-['JetBrains_Mono']">
                    {label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((statValues[i] / 99) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${accent}60, ${accent})`,
                      }}
                    />
                  </div>
                  <span
                    className="w-5 text-right text-[9px] font-bold font-['JetBrains_Mono']"
                    style={{ color: accent }}
                  >
                    {statValues[i]}
                  </span>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* OVR */}
            <p
              className="text-[28px] font-black leading-none font-['JetBrains_Mono']"
              style={{ color: accent }}
            >
              {stats.ovr}
            </p>
            <span className="text-[8px] font-bold tracking-widest text-white/30">
              OVR
            </span>

            {/* Tap hint */}
            <p className="mt-1 text-[8px] text-white/20">
              Touche pour retourner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
