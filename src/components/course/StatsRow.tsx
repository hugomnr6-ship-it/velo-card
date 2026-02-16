"use client";

import { motion } from "framer-motion";
import type { RouteSummary, RdiResult } from "@/types";
import type { ClimbSegment } from "@/lib/gpx-analysis";

interface StatsRowProps {
  summary: RouteSummary;
  rdi: RdiResult | null;
  climbCount: number;
}

const rdiColor = (rdi: RdiResult | null) => {
  if (!rdi) return "#64748B";
  if (rdi.score <= 3) return "#22C55E";
  if (rdi.score <= 6) return "#F59E0B";
  if (rdi.score <= 8) return "#F97316";
  return "#EF4444";
};

interface StatBoxProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: string;
  delay: number;
}

function StatBox({ icon, value, label, color, delay }: StatBoxProps) {
  return (
    <motion.div
      className="flex snap-center flex-col items-center rounded-2xl border border-white/[0.06] bg-[#16161F] px-3 py-3.5 min-w-[100px] transition-all hover:border-[#6366F1]/20"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="mb-1.5 text-white/30">{icon}</span>
      <span
        className="text-xl font-black font-['JetBrains_Mono'] leading-none"
        style={{ color: color || "#F8FAFC" }}
      >
        {value}
      </span>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/30">
        {label}
      </span>
    </motion.div>
  );
}

export default function StatsRow({ summary, rdi, climbCount }: StatsRowProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
      <StatBox
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
        value={`${summary.totalDistanceKm}`}
        label="km"
        delay={0}
      />
      <StatBox
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        value={`${summary.totalElevationGain}`}
        label="D+"
        color="#22C55E"
        delay={0.08}
      />
      <StatBox
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        value={`${summary.totalElevationLoss || summary.totalElevationGain}`}
        label="D-"
        color="#EF4444"
        delay={0.16}
      />
      <StatBox
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><path d="M8 3l4 8 5-5 2 4H1z"/></svg>}
        value={`${summary.maxElevation}`}
        label="Alt. Max"
        color="#06B6D4"
        delay={0.24}
      />
      {rdi && (
        <StatBox
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={rdiColor(rdi)} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          value={`${rdi.score}`}
          label={rdi.label}
          color={rdiColor(rdi)}
          delay={0.32}
        />
      )}
      {climbCount > 0 && (
        <StatBox
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M8 3l4 8 5-5 2 4H1z"/></svg>}
          value={`${climbCount}`}
          label="Montees"
          color="#F59E0B"
          delay={0.4}
        />
      )}
    </div>
  );
}
