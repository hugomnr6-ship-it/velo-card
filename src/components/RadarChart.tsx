"use client";

import type { ComputedStats, CardTier } from "@/types";

interface RadarChartProps {
  stats: ComputedStats;
  tier: CardTier;
  size?: number;
}

const tierAccent: Record<CardTier, { stroke: string; fill: string }> = {
  bronze: { stroke: "#cd7f32", fill: "rgba(205,127,50,0.25)" },
  argent: { stroke: "#C0C0C0", fill: "rgba(192,192,192,0.20)" },
  platine: { stroke: "#A8D8EA", fill: "rgba(168,216,234,0.25)" },
  diamant: { stroke: "#B9F2FF", fill: "rgba(185,242,255,0.25)" },
  legende: { stroke: "#FFD700", fill: "rgba(255,215,0,0.25)" },
};

const LABELS = ["PAC", "MON", "VAL", "SPR", "END", "RES"] as const;

function getHexPoint(centerX: number, centerY: number, radius: number, index: number): [number, number] {
  const angle = (Math.PI / 3) * index - Math.PI / 2;
  return [
    centerX + radius * Math.cos(angle),
    centerY + radius * Math.sin(angle),
  ];
}

function hexagonPath(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => getHexPoint(cx, cy, r, i))
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ") + " Z";
}

export default function RadarChart({ stats, tier, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const accent = tierAccent[tier];

  const statValues = [stats.pac, stats.mon, stats.val, stats.spr, stats.end, stats.res];

  // Data polygon — scale each stat (0-99) to radius
  const dataPoints = statValues
    .map((v, i) => getHexPoint(cx, cy, (v / 99) * maxRadius, i))
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid levels: 33%, 66%, 100% */}
      {[0.33, 0.66, 1].map((level) => (
        <path
          key={level}
          d={hexagonPath(cx, cy, maxRadius * level)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: 6 }).map((_, i) => {
        const [x, y] = getHexPoint(cx, cy, maxRadius, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={dataPoints}
        fill={accent.fill}
        stroke={accent.stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {statValues.map((v, i) => {
        const [x, y] = getHexPoint(cx, cy, (v / 99) * maxRadius, i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={accent.stroke}
          />
        );
      })}

      {/* Labels */}
      {LABELS.map((label, i) => {
        const [x, y] = getHexPoint(cx, cy, maxRadius + 16, i);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.5)"
            fontSize={10}
            fontWeight={700}
            fontFamily="JetBrains Mono, monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
