"use client";

import { m } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { CardTier } from "@/types";
import { IconCycling, IconMountain, IconChartUp } from "@/components/icons/VeloIcons";

/* ═══ Types ═══ */

interface HistoryEntry {
  week_label: string; pac: number; end: number; mon: number; res: number; spr: number; val: number;
  ovr: number; tier: CardTier; weekly_km: number; weekly_dplus: number; weekly_rides: number;
}

interface HistoryTabProps {
  chartData: { week: string; ovr: number; km: number }[];
  history: HistoryEntry[];
  accent: string;
  isOwner?: boolean;
}

/* ═══ Helpers ═══ */

function formatWeekLabel(label: string): string {
  const match = label.match(/W(\d+)/);
  return match ? `S${match[1]}` : label;
}

/* ═══ Component ═══ */

export default function HistoryTab({
  chartData, history, accent, isOwner = false,
}: HistoryTabProps) {
  if (chartData.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-3xl mb-2 flex justify-center"><IconChartUp size={32} className="text-white/30" /></div>
        <p className="text-sm text-white/30">Pas encore d&apos;historique</p>
        <p className="text-xs text-white/20 mt-1">Les donn&eacute;es appara&icirc;tront apr&egrave;s le premier Monday Update</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* OVR progression chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">PROGRESSION OVR</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="ovrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,10,18,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            />
            <Area
              type="monotone"
              dataKey="ovr"
              stroke={accent}
              strokeWidth={2}
              fill="url(#ovrGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly KM chart — données Strava, uniquement pour le propriétaire */}
      {isOwner && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">KILOMETRES HEBDO</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F5D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,18,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Area
                type="monotone"
                dataKey="km"
                stroke="#00F5D4"
                strokeWidth={2}
                fill="url(#kmGrad)"
                name="KM"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly history list */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">DETAIL PAR SEMAINE</p>
        <div className="flex flex-col gap-2">
          {[...history].reverse().slice(0, 8).map((h, i) => (
            <m.div
              key={h.week_label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="text-[10px] font-bold text-white/30 w-8">{formatWeekLabel(h.week_label)}</span>
              <span className="text-sm font-black font-['JetBrains_Mono'] text-white/80 w-8">{h.ovr}</span>
              {isOwner && (
                <div className="flex-1 flex items-center gap-2 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><IconCycling size={10} /> {h.weekly_km.toFixed(1)}km</span>
                  <span className="flex items-center gap-1"><IconMountain size={10} /> {h.weekly_dplus}m</span>
                  <span>&times;{h.weekly_rides}</span>
                </div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}
