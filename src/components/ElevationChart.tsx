"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { GpxPoint, CardTier } from "@/types";

interface ElevationChartProps {
  points: GpxPoint[];
  tier: CardTier;
}

const tierColors: Record<CardTier, { stroke: string; fill: string }> = {
  bronze: { stroke: "#f59e0b", fill: "rgba(217,119,6,0.2)" },
  silver: { stroke: "#94a3b8", fill: "rgba(148,163,184,0.2)" },
  gold: { stroke: "#facc15", fill: "rgba(250,204,21,0.2)" },
};

export default function ElevationChart({ points, tier }: ElevationChartProps) {
  const colors = tierColors[tier];

  // Sample points if too many (max 500 for performance)
  let sampled = points;
  if (points.length > 500) {
    const step = Math.ceil(points.length / 500);
    sampled = points.filter((_, i) => i % step === 0);
    // Always include the last point
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }
  }

  const data = sampled.map((p) => ({
    distance: Math.round(p.distFromStart * 10) / 10,
    altitude: Math.round(p.ele),
  }));

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Profil d&apos;altitude
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
          />
          <XAxis
            dataKey="distance"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            label={{
              value: "km",
              position: "insideBottomRight",
              offset: -5,
              style: { fill: "rgba(255,255,255,0.3)", fontSize: 10 },
            }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            label={{
              value: "m",
              position: "insideTopLeft",
              offset: -5,
              style: { fill: "rgba(255,255,255,0.3)", fontSize: 10 },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
            }}
            formatter={(value: number | string | undefined) => [
              `${value ?? 0} m`,
              "Altitude",
            ]}
            labelFormatter={(label: any) => `${label} km`}
          />
          <Area
            type="monotone"
            dataKey="altitude"
            stroke={colors.stroke}
            strokeWidth={2}
            fill="url(#elevGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
