"use client";

import { useMemo, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { GpxPoint } from "@/types";
import type { ClimbSegment, GradientSegment } from "@/lib/gpx-analysis";
import { getGradientColor } from "@/lib/gpx-analysis";

interface ElevationProfileProps {
  points: GpxPoint[];
  segments?: GradientSegment[];
  climbs: ClimbSegment[];
  hoveredKm?: number | null;
  onHoverKm?: (km: number | null) => void;
  height?: number;
}

export default function ElevationProfile({
  points,
  segments = [],
  climbs,
  hoveredKm = null,
  onHoverKm,
  height = 200,
}: ElevationProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sample points for chart performance (~300 max)
  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(points.length / 300));
    return points
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
  }, [points]);

  // Build SVG gradient stops based on terrain gradient segments
  const gradientStops = useMemo(() => {
    if (chartData.length === 0 || segments.length === 0) return null;
    const totalDist = chartData[chartData.length - 1].km;
    if (totalDist <= 0) return null;

    return segments.map((seg) => ({
      offset: ((seg.distStart + seg.distEnd) / 2 / totalDist) * 100,
      color: seg.color,
    }));
  }, [chartData, segments]);

  // Find hovered data point for tooltip
  const hoveredData = useMemo(() => {
    if (hoveredKm === null || chartData.length === 0) return null;
    let closest = chartData[0];
    let minDiff = Math.abs(chartData[0].km - hoveredKm);
    for (const d of chartData) {
      const diff = Math.abs(d.km - hoveredKm);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    return closest;
  }, [hoveredKm, chartData]);

  // Handle mouse move for sync with map
  const handleInteraction = useCallback(
    (e: any) => {
      if (!onHoverKm) return;
      if (!e?.activePayload?.[0]?.payload) return;
      const km = e.activePayload[0].payload.km;
      onHoverKm(km);
    },
    [onHoverKm]
  );

  const handleMouseLeave = useCallback(() => {
    onHoverKm?.(null);
  }, [onHoverKm]);

  // Touch handlers for mobile sync
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!onHoverKm || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      // Account for Y-axis width (~40px)
      const chartLeft = 40;
      const chartWidth = rect.width - chartLeft - 10;
      const adjustedX = x - chartLeft;
      const ratio = Math.max(0, Math.min(1, adjustedX / chartWidth));
      const totalDist = chartData[chartData.length - 1]?.km || 0;
      const km = Math.round(ratio * totalDist * 10) / 10;
      onHoverKm(km);
    },
    [chartData, onHoverKm]
  );

  const handleTouchEnd = useCallback(() => {
    onHoverKm?.(null);
  }, [onHoverKm]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
      <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">
        PROFIL D&apos;ELEVATION
      </p>

      <div
        ref={containerRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            onMouseMove={handleInteraction}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Dynamic gradient based on terrain */}
              {gradientStops ? (
                <linearGradient id="eleGradDynamic" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop, i) => (
                    <stop
                      key={i}
                      offset={`${stop.offset}%`}
                      stopColor={stop.color}
                      stopOpacity={0.25}
                    />
                  ))}
                </linearGradient>
              ) : (
                <linearGradient id="eleGradDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>

            <XAxis
              dataKey="km"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{
                fill: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontFamily: "JetBrains Mono",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{
                fill: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontFamily: "JetBrains Mono",
              }}
              axisLine={false}
              tickLine={false}
              width={38}
            />

            {/* Climb zones highlighted */}
            {climbs.map((climb, i) => (
              <ReferenceArea
                key={i}
                x1={Math.round(climb.distStart * 10) / 10}
                x2={Math.round(climb.distEnd * 10) / 10}
                fill="rgba(245,158,11,0.06)"
                stroke="rgba(245,158,11,0.15)"
                strokeWidth={1}
                label={{
                  value: climb.name,
                  position: "insideTopLeft",
                  fill: "#F59E0B",
                  fontSize: 9,
                  fontWeight: 700,
                  offset: 4,
                }}
              />
            ))}

            {/* Hover sync line from map */}
            {hoveredKm !== null && (
              <ReferenceLine
                x={hoveredKm}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}

            <Area
              type="monotone"
              dataKey="ele"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              fill="url(#eleGradDynamic)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#6366F1",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hover tooltip bar */}
      {hoveredData && hoveredKm !== null && (
        <div className="flex items-center justify-center gap-4 mt-1 py-1.5 rounded-lg bg-white/[0.03]">
          <span className="text-[10px] font-mono text-white/40">
            km {hoveredData.km}
          </span>
          <span className="text-[10px] font-bold font-mono text-white/70">
            {hoveredData.ele} m
          </span>
          <span
            className="text-[10px] font-bold font-mono"
            style={{ color: getGradientColor(hoveredData.gradient) }}
          >
            {hoveredData.gradient > 0 ? "+" : ""}
            {hoveredData.gradient}%
          </span>
        </div>
      )}

      {/* Gradient legend */}
      <div className="mt-2 flex flex-wrap items-center gap-2 justify-center">
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
            <span className="text-[8px] text-white/25">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
