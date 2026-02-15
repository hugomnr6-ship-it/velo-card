"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { GpxPoint } from "@/types";
import type { ClimbSegment } from "@/lib/gpx-analysis";
import { getGradientColor } from "@/lib/gpx-analysis";

interface ElevationProfileProps {
  points: GpxPoint[];
  climbs: ClimbSegment[];
}

export default function ElevationProfile({
  points,
  climbs,
}: ElevationProfileProps) {
  // Sample points to ~300 for chart performance
  const step = Math.max(1, Math.floor(points.length / 300));
  const chartData = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map((p, i, arr) => {
      let gradient = 0;
      if (i > 0) {
        const prev = arr[i - 1];
        const distKm = p.distFromStart - prev.distFromStart;
        if (distKm > 0.001) {
          gradient = ((p.ele - prev.ele) / (distKm * 1000)) * 100;
        }
      }
      return {
        km: Math.round(p.distFromStart * 10) / 10,
        ele: Math.round(p.ele),
        gradient: Math.round(gradient * 10) / 10,
      };
    });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">
        PROFIL D&apos;ELEVATION
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="km"
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            unit=" km"
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit=" m"
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,10,18,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            formatter={(value, name) => {
              if (name === "ele") return [`${value} m`, "Altitude"];
              return [`${value}`, name ?? ""];
            }}
            labelFormatter={(km) => `KM ${km}`}
          />
          {/* Climb reference lines */}
          {climbs.map((climb, i) => (
            <ReferenceLine
              key={i}
              x={Math.round(climb.distStart * 10) / 10}
              stroke="#FFD700"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
            />
          ))}
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#eleGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Gradient legend */}
      <div className="mt-3 flex flex-wrap items-center gap-2 justify-center">
        {[
          { label: "Descente", color: "#3B82F6" },
          { label: "0-3%", color: "#22C55E" },
          { label: "3-5%", color: "#EAB308" },
          { label: "5-8%", color: "#F97316" },
          { label: "8-12%", color: "#EF4444" },
          { label: "12%+", color: "#9333EA" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="h-2 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] text-white/30">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
