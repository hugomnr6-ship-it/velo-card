"use client";

import { useMemo } from "react";
import type { GpxPoint } from "@/types";
import type { ClimbSegment } from "@/lib/gpx-analysis";
import { getGradientColor } from "@/lib/gpx-analysis";

interface ClimbDetailViewProps {
  climb: ClimbSegment;
  points: GpxPoint[];
  onBack: () => void;
}

export default function ClimbDetailView({
  climb,
  points,
  onBack,
}: ClimbDetailViewProps) {
  // Extract & sample points for this climb
  const profileData = useMemo(() => {
    const raw = points.slice(climb.startIdx, climb.endIdx + 1);
    if (raw.length < 2) return [];

    // Sample to ~150 points
    const step = Math.max(1, Math.floor(raw.length / 150));
    const sampled = raw.filter(
      (_, i) => i % step === 0 || i === raw.length - 1,
    );

    // Compute per-segment gradient
    return sampled.map((p, i, arr) => {
      let gradient = 0;
      if (i > 0) {
        const prev = arr[i - 1];
        const distKm = p.distFromStart - prev.distFromStart;
        if (distKm > 0.001) {
          gradient = ((p.ele - prev.ele) / (distKm * 1000)) * 100;
        }
      }
      return {
        dist: p.distFromStart - raw[0].distFromStart, // km from climb start
        ele: p.ele,
        gradient,
        color: getGradientColor(gradient),
      };
    });
  }, [climb, points]);

  // SVG dimensions
  const svgW = 500;
  const svgH = 220;
  const padL = 38;
  const padR = 10;
  const padT = 12;
  const padB = 24;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  // Scales
  const { minEle, maxEle, maxDist, toX, toY, yTicks, xTicks } =
    useMemo(() => {
      if (profileData.length === 0)
        return {
          minEle: 0,
          maxEle: 100,
          maxDist: 1,
          toX: () => 0,
          toY: () => 0,
          yTicks: [] as number[],
          xTicks: [] as number[],
        };

      const eles = profileData.map((d) => d.ele);
      const rawMin = Math.min(...eles);
      const rawMax = Math.max(...eles);
      const eleRange = rawMax - rawMin || 50;
      const padEle = eleRange * 0.1;
      const mn = rawMin - padEle;
      const mx = rawMax + padEle;
      const md = profileData[profileData.length - 1].dist || 1;

      const tx = (dist: number) => padL + (dist / md) * chartW;
      const ty = (ele: number) =>
        padT + chartH - ((ele - mn) / (mx - mn)) * chartH;

      // Y-axis ticks (~4-5 ticks)
      const yStep = Math.ceil((mx - mn) / 5 / 10) * 10; // round to 10m
      const yt: number[] = [];
      for (
        let v = Math.ceil(mn / yStep) * yStep;
        v <= mx;
        v += yStep
      ) {
        yt.push(v);
      }

      // X-axis ticks (~4-5 ticks)
      const xStep =
        md <= 1
          ? 0.2
          : md <= 3
            ? 0.5
            : md <= 8
              ? 1
              : md <= 20
                ? 2
                : 5;
      const xt: number[] = [];
      for (let v = 0; v <= md + 0.01; v += xStep) {
        xt.push(Math.round(v * 10) / 10);
      }

      return { minEle: mn, maxEle: mx, maxDist: md, toX: tx, toY: ty, yTicks: yt, xTicks: xt };
    }, [profileData, chartW, chartH]);

  // Build colored trapezoids for each segment
  const trapezoids = useMemo(() => {
    if (profileData.length < 2) return [];
    return profileData.slice(1).map((d, i) => {
      const prev = profileData[i];
      const x1 = toX(prev.dist);
      const x2 = toX(d.dist);
      const y1Top = toY(prev.ele);
      const y2Top = toY(d.ele);
      const yBottom = toY(minEle);
      return {
        points: `${x1},${y1Top} ${x2},${y2Top} ${x2},${yBottom} ${x1},${yBottom}`,
        color: d.color,
      };
    });
  }, [profileData, toX, toY, minEle]);

  // Elevation outline path
  const linePath = useMemo(() => {
    if (profileData.length < 2) return "";
    return profileData
      .map((d, i) => `${i === 0 ? "M" : "L"}${toX(d.dist)},${toY(d.ele)}`)
      .join(" ");
  }, [profileData, toX, toY]);

  const color = gradientColor(climb.avgGradient);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#16161F] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-7 w-7 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/70 transition"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-xs font-bold text-white">{climb.name}</span>
        <span className="ml-auto text-[9px] font-mono text-white/25">
          km {Math.round(climb.distStart * 10) / 10} &rarr;{" "}
          {Math.round(climb.distEnd * 10) / 10}
        </span>
      </div>

      {/* SVG Profile */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Colored trapezoids */}
          {trapezoids.map((t, i) => (
            <polygon
              key={i}
              points={t.points}
              fill={t.color}
              fillOpacity={0.5}
              stroke={t.color}
              strokeWidth={0.5}
            />
          ))}

          {/* White elevation line on top */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Y-axis ticks */}
          {yTicks.map((v) => (
            <g key={`y-${v}`}>
              <line
                x1={padL}
                x2={svgW - padR}
                y1={toY(v)}
                y2={toY(v)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.5}
              />
              <text
                x={padL - 4}
                y={toY(v) + 3}
                textAnchor="end"
                fill="rgba(255,255,255,0.2)"
                fontSize={8}
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.round(v)}
              </text>
            </g>
          ))}

          {/* X-axis ticks */}
          {xTicks.map((v) => (
            <text
              key={`x-${v}`}
              x={toX(v)}
              y={svgH - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize={8}
              fontFamily="JetBrains Mono, monospace"
            >
              {v}
            </text>
          ))}

          {/* Unit labels */}
          <text
            x={padL - 4}
            y={padT - 2}
            textAnchor="end"
            fill="rgba(255,255,255,0.12)"
            fontSize={7}
            fontFamily="JetBrains Mono, monospace"
          >
            m
          </text>
          <text
            x={svgW - padR}
            y={svgH - 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.12)"
            fontSize={7}
            fontFamily="JetBrains Mono, monospace"
          >
            km
          </text>
        </svg>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
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
            style={{
              color: climb.maxGradient >= 10 ? "#EF4444" : "#F97316",
            }}
          >
            {climb.maxGradient}%
          </p>
          <p className="text-[7px] text-white/25">MAX</p>
        </div>
      </div>

      {/* Elevation range */}
      <div className="flex items-center justify-center gap-3 mt-2 text-[9px] font-mono text-white/30">
        <span>{climb.startEle} m</span>
        <svg className="h-2.5 w-6 text-white/15" viewBox="0 0 24 10">
          <path d="M0 8 L12 2 L24 8" fill="none" stroke="currentColor" strokeWidth={1.5} />
        </svg>
        <span>{climb.endEle} m</span>
      </div>

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
            <span className="text-[8px] text-white/25">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function gradientColor(pct: number): string {
  if (pct >= 12) return "#9333EA";
  if (pct >= 8) return "#EF4444";
  if (pct >= 5) return "#F97316";
  if (pct >= 3) return "#EAB308";
  return "#22C55E";
}
