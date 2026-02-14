"use client";

import type { RouteSummary, CardTier } from "@/types";

interface RouteSummaryPanelProps {
  summary: RouteSummary;
  tier: CardTier;
}

const tierValueColors: Record<CardTier, string> = {
  bronze: "text-amber-400",
  argent: "text-slate-200",
  platine: "text-[#A8D8EA]",
  diamant: "text-[#B9F2FF]",
  legende: "text-yellow-300",
};

export default function RouteSummaryPanel({
  summary,
  tier,
}: RouteSummaryPanelProps) {
  const valueColor = tierValueColors[tier];

  const stats = [
    { label: "Distance", value: `${summary.totalDistanceKm} km` },
    { label: "Dénivelé +", value: `${summary.totalElevationGain.toLocaleString("fr-FR")} m` },
    { label: "Alt. max", value: `${summary.maxElevation.toLocaleString("fr-FR")} m` },
    { label: "Alt. min", value: `${summary.minElevation.toLocaleString("fr-FR")} m` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-3 text-center"
        >
          <p className={`text-lg font-bold ${valueColor}`}>{s.value}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
