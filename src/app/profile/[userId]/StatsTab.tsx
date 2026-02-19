"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { CardTier } from "@/types";
import { IconStar, IconMountain, IconRocket, IconTrophy, IconChartUp } from "@/components/icons/VeloIcons";

/* ═══ Types ═══ */

interface StatsData {
  pac: number; end: number; mon: number; res: number; spr: number; val: number;
  ovr: number; tier: CardTier; special_card: string | null;
  active_weeks_streak: number;
}

interface DeltasData {
  pac: number; end: number; mon: number; res: number; spr: number; val: number; ovr: number;
}

interface ClubData {
  id: string; name: string; logo_url: string | null;
}

interface StatsTabProps {
  stats: StatsData;
  deltas: DeltasData | null;
  accent: string;
  tier: CardTier;
  radarData: { stat: string; value: number; fullMark: number }[];
  clubs: ClubData[];
}

/* ═══ Constants ═══ */

const statLabels: Record<string, string> = {
  pac: "Vitesse", mon: "Grimpeur", val: "Technique", spr: "Sprint", end: "Endurance", res: "Puissance",
};

const statIcons: Record<string, any> = {
  pac: IconStar, mon: IconMountain, val: IconStar, spr: IconRocket, end: IconTrophy, res: IconChartUp,
};

/* ═══ Helpers ═══ */

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className={`text-[10px] font-bold ${value > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value > 0 ? "\u2191" : "\u2193"}{Math.abs(value)}
    </span>
  );
}

/* ═══ Component ═══ */

export default function StatsTab({
  stats, deltas, accent, tier, radarData, clubs,
}: StatsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Radar chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">RADAR DE STATS</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700 }}
            />
            <Radar
              dataKey="value"
              stroke={accent}
              fill={accent}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-3 gap-2">
        {(["pac", "mon", "val", "spr", "end", "res"] as const).map((key) => (
          <div
            key={key}
            className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <span className="flex items-center">{(() => { const I = statIcons[key]; return I ? <I size={18} className="text-white/60" /> : null; })()}</span>
            <span className="mt-1 text-xl font-black font-['JetBrains_Mono']" style={{ color: accent }}>
              {stats[key]}
            </span>
            {deltas && <DeltaBadge value={deltas[key]} />}
            <span className="mt-0.5 text-[8px] font-bold tracking-wider text-white/30">
              {statLabels[key].toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Clubs */}
      {clubs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">CLUBS</p>
          <div className="flex flex-wrap gap-2">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              >
                {club.logo_url && (
                  <img
                    src={`/api/img?url=${encodeURIComponent(club.logo_url)}`}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                <span className="text-xs font-semibold text-white/70">{club.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
