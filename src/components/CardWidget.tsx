"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import type { ComputedStats, CardTier, StatDeltas } from "@/types";
import { tierConfig } from "./VeloCard";
import { useCountUp } from "@/hooks/useCountUp";
import { IconArrowUp, IconArrowDown } from "@/components/icons/VeloIcons";

interface CardWidgetProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  userId: string;
  deltas?: StatDeltas | null;
}

/* Tier thresholds for progress bar */
const tierThresholds: { tier: CardTier; min: number; max: number }[] = [
  { tier: "bronze", min: 0, max: 49 },
  { tier: "argent", min: 50, max: 64 },
  { tier: "platine", min: 65, max: 79 },
  { tier: "diamant", min: 80, max: 89 },
  { tier: "legende", min: 90, max: 99 },
];

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C8D4",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

const nextTierLabel: Record<CardTier, string | null> = {
  bronze: "ARGENT",
  argent: "PLATINE",
  platine: "DIAMANT",
  diamant: "LÉGENDE",
  legende: null,
};

function getProgress(ovr: number, tier: CardTier): number {
  const t = tierThresholds.find((th) => th.tier === tier);
  if (!t) return 100;
  if (tier === "legende") return 100;
  const range = t.max - t.min + 1;
  return Math.min(100, Math.round(((ovr - t.min) / range) * 100));
}

export default memo(function CardWidget({
  username,
  avatarUrl,
  stats,
  tier,
  userId,
  deltas,
}: CardWidgetProps) {
  const config = tierConfig[tier];
  const accent = tierAccentHex[tier];
  const progress = getProgress(stats.ovr, tier);
  const nextTier = nextTierLabel[tier];
  const animatedOvr = useCountUp(stats.ovr, 1200, { enabled: stats.ovr > 0 });

  const statPills = useMemo<{ label: string; value: number; delta: number }[]>(() => [
    { label: "VIT", value: stats.pac, delta: deltas?.pac ?? 0 },
    { label: "MON", value: stats.mon, delta: deltas?.mon ?? 0 },
    { label: "TEC", value: stats.val, delta: deltas?.val ?? 0 },
    { label: "SPR", value: stats.spr, delta: deltas?.spr ?? 0 },
    { label: "END", value: stats.end, delta: deltas?.end ?? 0 },
    { label: "PUI", value: stats.res, delta: deltas?.res ?? 0 },
  ], [stats.pac, stats.mon, stats.val, stats.spr, stats.end, stats.res, deltas]);

  return (
    <Link
      href="/profile"
      className={`block w-full max-w-md rounded-2xl border border-white/[0.08] bg-gradient-to-r ${config.bg} p-4 transition hover:border-white/[0.15]`}
      style={{
        boxShadow: `0 0 24px ${accent}10, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div className="flex gap-4">
        {/* Mini card thumbnail */}
        <div
          className={`relative h-[92px] w-[64px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b ${config.bg}`}
        >
          {/* Mini avatar */}
          <div className="flex h-full flex-col items-center justify-center">
            {avatarUrl ? (
              <img
                src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
                alt=""
                className="h-8 w-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/10" />
            )}
            <span
              className="mt-1 text-[20px] font-black leading-none font-['JetBrains_Mono']"
              style={{ color: accent }}
            >
              {animatedOvr}
            </span>
            <span className="text-[6px] font-bold tracking-widest text-white/40">
              {config.label}
            </span>
          </div>
          {/* Scan-lines */}
          <div className="scan-lines pointer-events-none absolute inset-0 rounded-lg" />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Name + OVR */}
          <div>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-white font-['Space_Grotesk']">
                {username}
              </p>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
                style={{
                  color: accent,
                  backgroundColor: `${accent}15`,
                  border: `1px solid ${accent}30`,
                }}
              >
                {config.label}
              </span>
            </div>

            {/* Progress bar */}
            {nextTier && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[9px] text-white/40">
                  <span className="flex items-center gap-1">
                    OVR {stats.ovr}
                    {deltas && deltas.ovr !== 0 && (
                      <span className={`font-bold ${deltas.ovr > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ({deltas.ovr > 0 ? "+" : ""}{deltas.ovr})
                      </span>
                    )}
                  </span>
                  <span className="text-white/25">Prochain: {nextTier}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${accent}80, ${accent})`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stat pills */}
          <div className="mt-2 flex flex-wrap gap-1">
            {statPills.map((s) => (
              <span
                key={s.label}
                className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-white/60"
              >
                <span className="text-white/40">{s.label}</span>{" "}
                <span style={{ color: `${accent}cc` }}>{s.value}</span>
                {s.delta !== 0 && (
                  <span className={`ml-0.5 ${s.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    <span className="inline-flex items-center">{s.delta > 0 ? <IconArrowUp size={8} /> : <IconArrowDown size={8} />}</span>{Math.abs(s.delta)}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
});
