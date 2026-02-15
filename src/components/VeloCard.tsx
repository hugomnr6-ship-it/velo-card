"use client";

import { useState, useEffect } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import type { ComputedStats, CardTier, Badge, ClubInfo, SpecialCardType } from "@/types";

/* ════════════════════════════════════════════
   VeloCard — Design B "Shield" + Circular Gauges
   ════════════════════════════════════════════ */

interface VeloCardProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges?: Badge[];
  clubs?: ClubInfo[];
  specialCard?: SpecialCardType | null;
  country?: string;
  countryCode?: string;
}

/* ═══ Tier accent hex ═══ */
const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

/* ═══ Special card accent overrides ═══ */
const specialAccentHex: Record<SpecialCardType, string> = {
  totw: "#00F5A0",
  in_form: "#FF6B35",
  legend_moment: "#B9F2FF",
};

/* ═══ DESIGN B — Internal visual config per tier ═══ */
interface CardVisual {
  accentHex: string;
  bgGradient: string;
  crestGradient: string;
  crestTextColor: string;
  ringGradient: string;
  shimmerColor: string;
  statColor: string;
  glowHex: string;
  borderRgba: string;
  dividerRgba: string;
  gaugeBgStroke: string;
  hasSilverSweep: boolean;
  hasParticles: boolean;
  hasHoloScan: boolean;
  hasRainbow: boolean;
  particleCount: number;
  particleColors: string[];
  label: string;
}

const cardVisuals: Record<CardTier, CardVisual> = {
  bronze: {
    accentHex: "#E8A854",
    bgGradient: "linear-gradient(170deg, #1A1208, #241A0D 50%, #1A1208)",
    crestGradient: "linear-gradient(180deg, #E8A854, #CD7F32)",
    crestTextColor: "#1A1208",
    ringGradient: "linear-gradient(180deg, #E8A854, #8B6830)",
    shimmerColor: "rgba(232,168,84,0.1)",
    statColor: "#E8A854",
    glowHex: "rgba(232,168,84,0.3)",
    borderRgba: "rgba(232,168,84,0.2)",
    dividerRgba: "rgba(232,168,84,0.2)",
    gaugeBgStroke: "rgba(255,255,255,0.04)",
    hasSilverSweep: false,
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
    particleColors: ["#E8A854"],
    label: "BRONZE",
  },
  argent: {
    accentHex: "#B8A0D8",
    bgGradient: "linear-gradient(170deg, #14101E, #1E1430 50%, #14101E)",
    crestGradient: "linear-gradient(180deg, #C8B0E8, #9880B8)",
    crestTextColor: "#14101E",
    ringGradient: "linear-gradient(180deg, #C8B0E8, #8870A8)",
    shimmerColor: "rgba(184,160,216,0.14)",
    statColor: "#D0C0E8",
    glowHex: "rgba(184,160,216,0.25)",
    borderRgba: "rgba(184,160,216,0.2)",
    dividerRgba: "rgba(184,160,216,0.2)",
    gaugeBgStroke: "rgba(184,160,216,0.06)",
    hasSilverSweep: true,
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
    particleColors: ["#B8A0D8"],
    label: "ARGENT",
  },
  platine: {
    accentHex: "#E0E8F0",
    bgGradient: "linear-gradient(170deg, #101820, #1A2838 50%, #101820)",
    crestGradient: "linear-gradient(180deg, #E0E8F0, #B0B8C8)",
    crestTextColor: "#101820",
    ringGradient: "linear-gradient(180deg, #E0E8F0, #A8B4C4)",
    shimmerColor: "rgba(224,232,240,0.14)",
    statColor: "#E0E8F0",
    glowHex: "rgba(224,232,240,0.3)",
    borderRgba: "rgba(224,232,240,0.18)",
    dividerRgba: "rgba(224,232,240,0.18)",
    gaugeBgStroke: "rgba(224,232,240,0.05)",
    hasSilverSweep: false,
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
    particleColors: ["#E0E8F0"],
    label: "PLATINE",
  },
  diamant: {
    accentHex: "#00D4FF",
    bgGradient: "linear-gradient(170deg, #041018, #0C2038 50%, #041018)",
    crestGradient: "linear-gradient(180deg, #00D4FF, #0088AA)",
    crestTextColor: "#041018",
    ringGradient: "linear-gradient(180deg, #00D4FF, #0098CC)",
    shimmerColor: "rgba(0,212,255,0.12)",
    statColor: "#00D4FF",
    glowHex: "rgba(0,212,255,0.35)",
    borderRgba: "rgba(0,212,255,0.22)",
    dividerRgba: "rgba(0,212,255,0.22)",
    gaugeBgStroke: "rgba(0,212,255,0.06)",
    hasSilverSweep: false,
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: false,
    particleCount: 12,
    particleColors: ["#00D4FF", "#B9F2FF"],
    label: "DIAMANT",
  },
  legende: {
    accentHex: "#FFD700",
    bgGradient: "linear-gradient(170deg, #1A0A28, #2A1040 30%, #201808 60%, #1A0A28)",
    crestGradient: "linear-gradient(180deg, #FFD700, #FF9500)",
    crestTextColor: "#1A0A28",
    ringGradient: "linear-gradient(180deg, #FFD700, #CC8800)",
    shimmerColor: "rgba(255,215,0,0.18)",
    statColor: "#FFE44D",
    glowHex: "rgba(255,215,0,0.5)",
    borderRgba: "rgba(255,215,0,0.30)",
    dividerRgba: "rgba(255,215,0,0.30)",
    gaugeBgStroke: "rgba(255,215,0,0.06)",
    hasSilverSweep: false,
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: true,
    particleCount: 30,
    particleColors: ["#FFD700", "#FFE44D", "#FFC000", "#A78BFA", "#FF9500"],
    label: "LEGENDE",
  },
};

/* ═══ SPECIAL CARD — Design B configs ═══ */
interface SpecialVisual {
  accentHex: string;
  bgGradient: string;
  crestGradient: string;
  crestTextColor: string;
  ringGradient: string;
  statColor: string;
  glowHex: string;
  borderRgba: string;
  dividerRgba: string;
  pillLabel: string;
  hasParticles: boolean;
  hasHoloScan: boolean;
  hasRainbow: boolean;
  particleCount: number;
  particleColors: string[];
}

const specialVisuals: Record<SpecialCardType, SpecialVisual> = {
  totw: {
    accentHex: "#00F5A0",
    bgGradient: "linear-gradient(170deg, #040A08, #0A1A12 50%, #040A08)",
    crestGradient: "linear-gradient(180deg, #00F5A0, #00A868)",
    crestTextColor: "#040A08",
    ringGradient: "linear-gradient(180deg, rgba(0,245,160,0.9), rgba(0,168,104,0.5))",
    statColor: "#40FFB8",
    glowHex: "rgba(0,245,160,0.45)",
    borderRgba: "rgba(0,245,160,0.3)",
    dividerRgba: "rgba(0,245,160,0.3)",
    pillLabel: "ÉCHAPPÉE",
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: false,
    particleCount: 20,
    particleColors: ["#00F5A0", "#40FFB8", "#00D888", "#80FFD0"],
  },
  in_form: {
    accentHex: "#FF6B35",
    bgGradient: "linear-gradient(170deg, #1A0800, #2D1208 50%, #1A0500)",
    crestGradient: "linear-gradient(180deg, #FF6B35, #CC4400)",
    crestTextColor: "#1A0800",
    ringGradient: "linear-gradient(180deg, rgba(255,107,53,0.9), rgba(255,60,0,0.5))",
    statColor: "#FF8C5A",
    glowHex: "rgba(255,107,53,0.4)",
    borderRgba: "rgba(255,107,53,0.25)",
    dividerRgba: "rgba(255,107,53,0.25)",
    pillLabel: "IN FORM",
    hasParticles: true,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 18,
    particleColors: ["#FF6B35", "#FF4500", "#FF8C00", "#FFD700"],
  },
  legend_moment: {
    accentHex: "#B9F2FF",
    bgGradient: "linear-gradient(170deg, #0A0020, #1A0A40 50%, #000A20)",
    crestGradient: "linear-gradient(180deg, #B9F2FF, #6366F1)",
    crestTextColor: "#0A0020",
    ringGradient: "linear-gradient(180deg, rgba(185,242,255,0.9), rgba(99,102,241,0.6))",
    statColor: "#B9F2FF",
    glowHex: "rgba(185,242,255,0.35)",
    borderRgba: "rgba(185,242,255,0.25)",
    dividerRgba: "rgba(185,242,255,0.25)",
    pillLabel: "LÉGENDE",
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: true,
    particleCount: 30,
    particleColors: ["#B9F2FF", "#6366F1", "#A78BFA", "#818CF8"],
  },
};

/* ════════════════════════════════════════════
   BACKWARD-COMPATIBLE EXPORTS
   (used by GhostCard, DashboardFeed, duels,
    echappee, profile, etc.)
   ════════════════════════════════════════════ */

export const tierConfig: Record<
  CardTier,
  {
    bg: string;
    accent: string;
    accentLight: string;
    glowClass: string;
    avatarGlow: string;
    shimmerGradient: string;
    label: string;
    hasParticles: boolean;
    hasHoloScan: boolean;
    hasRainbow: boolean;
    particleCount: number;
  }
> = {
  bronze: {
    bg: "from-[#1A1208] via-[#241A0D] to-[#1A1208]",
    accent: "text-[#E8A854]",
    accentLight: "text-[#E8A854]",
    glowClass: "card-glow-bronze",
    avatarGlow: "avatar-glow-bronze",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(232,168,84,0.20) 50%, transparent 70%)",
    label: "BRONZE",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
  },
  argent: {
    bg: "from-[#14101E] via-[#1E1430] to-[#14101E]",
    accent: "text-[#B8A0D8]",
    accentLight: "text-[#D0C0E8]",
    glowClass: "card-glow-argent",
    avatarGlow: "avatar-glow-argent",
    shimmerGradient:
      "linear-gradient(110deg, transparent 25%, rgba(184,160,216,0.18) 45%, rgba(208,192,232,0.24) 50%, rgba(184,160,216,0.18) 55%, transparent 75%)",
    label: "ARGENT",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
  },
  platine: {
    bg: "from-[#101820] via-[#1A2838] to-[#101820]",
    accent: "text-[#E0E8F0]",
    accentLight: "text-[#E0E8F0]",
    glowClass: "card-glow-platine",
    avatarGlow: "avatar-glow-platine",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(224,232,240,0.18) 50%, transparent 70%)",
    label: "PLATINE",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
    particleCount: 0,
  },
  diamant: {
    bg: "from-[#041018] via-[#0C2038] to-[#041018]",
    accent: "text-[#00D4FF]",
    accentLight: "text-[#B9F2FF]",
    glowClass: "card-glow-diamant",
    avatarGlow: "avatar-glow-diamant",
    shimmerGradient:
      "linear-gradient(110deg, transparent 25%, rgba(0,212,255,0.22) 50%, transparent 75%)",
    label: "DIAMANT",
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: false,
    particleCount: 12,
  },
  legende: {
    bg: "from-[#1A0A28] via-[#2A1040] to-[#201808]",
    accent: "text-[#FFD700]",
    accentLight: "text-[#ffe44d]",
    glowClass: "card-glow-legende",
    avatarGlow: "avatar-glow-legende",
    shimmerGradient:
      "linear-gradient(110deg, transparent 25%, rgba(255,215,0,0.25) 50%, transparent 75%)",
    label: "LEGENDE",
    hasParticles: true,
    hasHoloScan: true,
    hasRainbow: true,
    particleCount: 30,
  },
};

export const tierBorderColors: Record<CardTier, string> = {
  bronze: "border-[#E8A854]/20",
  argent: "border-[#B8A0D8]/20",
  platine: "border-[#E0E8F0]/18",
  diamant: "border-[#00D4FF]/22",
  legende: "border-[#ffd700]/30",
};

export const tierDividerColors: Record<CardTier, string> = {
  bronze: "from-transparent via-[#E8A854]/30 to-transparent",
  argent: "from-transparent via-[#B8A0D8]/25 to-transparent",
  platine: "from-transparent via-[#E0E8F0]/20 to-transparent",
  diamant: "from-transparent via-[#00D4FF]/30 to-transparent",
  legende: "from-transparent via-[#ffd700]/40 to-transparent",
};

export const spotlightGradients: Record<CardTier, string> = {
  bronze:
    "linear-gradient(135deg, transparent 20%, rgba(232,168,84,0.08) 35%, rgba(255,255,255,0.12) 50%, rgba(232,168,84,0.08) 65%, transparent 80%)",
  argent:
    "linear-gradient(135deg, transparent 15%, rgba(184,160,216,0.10) 30%, rgba(208,192,232,0.18) 50%, rgba(184,160,216,0.10) 70%, transparent 85%)",
  platine:
    "linear-gradient(135deg, transparent 20%, rgba(224,232,240,0.10) 35%, rgba(255,255,255,0.15) 50%, rgba(224,232,240,0.10) 65%, transparent 80%)",
  diamant:
    "linear-gradient(135deg, transparent 15%, rgba(0,212,255,0.12) 30%, rgba(185,242,255,0.20) 50%, rgba(0,212,255,0.12) 70%, transparent 85%)",
  legende:
    "linear-gradient(135deg, transparent 20%, rgba(255,215,0,0.10) 35%, rgba(255,255,255,0.15) 50%, rgba(255,215,0,0.10) 65%, transparent 80%)",
};

export const tierPillBg: Record<CardTier, string> = {
  bronze: "rgba(26,18,8,0.85)",
  argent: "rgba(20,16,30,0.85)",
  platine: "rgba(16,24,56,0.85)",
  diamant: "rgba(4,16,24,0.85)",
  legende: "rgba(26,10,40,0.85)",
};

export const tierPillBorder: Record<CardTier, string> = {
  bronze: "rgba(232,168,84,0.4)",
  argent: "rgba(184,160,216,0.4)",
  platine: "rgba(224,232,240,0.3)",
  diamant: "rgba(0,212,255,0.4)",
  legende: "rgba(255,215,0,0.4)",
};

export const tierOuterBorderColor: Record<CardTier, string> = {
  bronze: "rgba(232,168,84,0.25)",
  argent: "rgba(184,160,216,0.25)",
  platine: "rgba(224,232,240,0.25)",
  diamant: "rgba(0,212,255,0.30)",
  legende: "rgba(255,215,0,0.30)",
};

export const tierHexBg: Record<CardTier, string> = {
  bronze: "linear-gradient(180deg, rgba(30,20,10,0.9), rgba(20,12,5,0.95))",
  argent: "linear-gradient(180deg, rgba(20,16,30,0.92), rgba(14,10,24,0.96))",
  platine: "linear-gradient(180deg, rgba(16,24,56,0.9), rgba(12,20,48,0.95))",
  diamant: "linear-gradient(180deg, rgba(4,16,32,0.92), rgba(4,12,24,0.96))",
  legende: "linear-gradient(180deg, rgba(26,10,40,0.9), rgba(32,24,8,0.95))",
};

export const tierValueColors: Record<CardTier, string> = {
  bronze: "text-[#E8A854]",
  argent: "text-[#D0C0E8]",
  platine: "text-[#E0E8F0]",
  diamant: "text-[#00D4FF]",
  legende: "text-[#ffe44d]",
};

/* ════════════════════════════════════════════
   CIRCULAR GAUGE COMPONENT
   ════════════════════════════════════════════ */

const CIRCUMFERENCE = 2 * Math.PI * 24; // r=24 → ~150.796

function CircularGauge({
  label,
  value,
  accentHex,
  glowHex,
  statColor,
  gaugeBgStroke,
}: {
  label: string;
  value: number;
  accentHex: string;
  glowHex: string;
  statColor: string;
  gaugeBgStroke: string;
}) {
  const offset = CIRCUMFERENCE * (1 - value / 100);
  const isElite = value >= 90;

  return (
    <div className="flex flex-col items-center py-1">
      <div className="relative" style={{ width: 56, height: 56 }}>
        <svg
          viewBox="0 0 56 56"
          width="56"
          height="56"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke={gaugeBgStroke}
            strokeWidth="3"
          />
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke={accentHex}
            strokeWidth={isElite ? 3.5 : 3}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 ${isElite ? 8 : 4}px ${glowHex})`,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-['JetBrains_Mono'] text-[15px] font-extrabold leading-none"
            style={{
              color: statColor,
              textShadow: isElite ? `0 0 12px ${glowHex}` : "none",
            }}
          >
            {value}
          </span>
          <span className="mt-[1px] text-[7px] font-bold tracking-[0.1em] text-white/[0.28]">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   STATHEX — Legacy export for GhostCard
   ════════════════════════════════════════════ */

export function StatHex({
  label,
  value,
  tier,
  hexOuterBorder,
  hexBg,
  valueColorClass,
  accentHex,
}: {
  label: string;
  value: number;
  tier: CardTier;
  hexOuterBorder?: string;
  hexBg?: string;
  valueColorClass?: string;
  accentHex?: string;
}) {
  const isElite = value >= 90;
  const outerBg = hexOuterBorder || tierOuterBorderColor[tier];
  const innerBg = hexBg || tierHexBg[tier];
  const valColor = valueColorClass || tierValueColors[tier];
  const accent = accentHex || tierAccentHex[tier];

  return (
    <div className="flex h-[100px] w-[90px] flex-col items-center justify-center">
      <div
        className="stat-badge flex items-center justify-center"
        style={{
          width: 79,
          height: 84,
          background: isElite
            ? `linear-gradient(180deg, ${accent}, ${accent}66)`
            : outerBg,
        }}
      >
        <div
          className={`stat-badge flex h-[76px] w-[71px] flex-col items-center justify-center ${isElite ? "stat-elite" : ""}`}
          style={{
            background: innerBg,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.3)${isElite ? `, 0 0 12px ${accent}` : ""}`,
          }}
        >
          <span className={`text-2xl font-black font-['JetBrains_Mono'] ${isElite ? "text-yellow-200" : valColor}`}>
            {value}
          </span>
          <span className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-white/50">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT — DESIGN B SHIELD
   ════════════════════════════════════════════ */

export default function VeloCard({
  username,
  avatarUrl,
  stats,
  tier,
  badges = [],
  clubs = [],
  specialCard,
  country,
  countryCode,
}: VeloCardProps) {
  const cv = cardVisuals[tier];
  const sv = specialCard ? specialVisuals[specialCard] : null;
  const animatedOvr = useCountUp(stats.ovr);

  /* Resolve — special overrides tier */
  const accentHex   = sv ? sv.accentHex   : cv.accentHex;
  const bgGradient  = sv ? sv.bgGradient  : cv.bgGradient;
  const crestGrad   = sv ? sv.crestGradient : cv.crestGradient;
  const crestTxtClr = sv ? sv.crestTextColor : cv.crestTextColor;
  const ringGrad    = sv ? sv.ringGradient  : cv.ringGradient;
  const statClr     = sv ? sv.statColor    : cv.statColor;
  const glowHex     = sv ? sv.glowHex     : cv.glowHex;
  const borderClr   = sv ? sv.borderRgba   : cv.borderRgba;
  const dividerClr  = sv ? sv.dividerRgba  : cv.dividerRgba;
  const gaugeBg     = cv.gaugeBgStroke;
  const pillLabel   = sv ? sv.pillLabel    : cv.label;
  const hasParticles= sv ? sv.hasParticles : cv.hasParticles;
  const hasHoloScan = sv ? sv.hasHoloScan  : cv.hasHoloScan;
  const hasRainbow  = sv ? sv.hasRainbow   : cv.hasRainbow;
  const pCount      = sv ? sv.particleCount : cv.particleCount;
  const pColors     = sv ? sv.particleColors : cv.particleColors;
  const hasSilverSweep = !sv && cv.hasSilverSweep;

  /* Rotating club logo */
  const [clubIndex, setClubIndex] = useState(0);
  useEffect(() => {
    if (clubs.length <= 1) return;
    const iv = setInterval(() => setClubIndex((p) => (p + 1) % clubs.length), 3000);
    return () => clearInterval(iv);
  }, [clubs.length]);
  const currentClub = clubs.length > 0 ? clubs[clubIndex] : null;

  const isAnimated = hasHoloScan || hasRainbow || tier === "diamant" || tier === "legende" || tier === "argent" || !!sv;

  return (
    <div
      id="velo-card"
      className={`relative overflow-hidden ${isAnimated ? "glow-pulse" : ""}`}
      style={{
        width: 280,
        height: 470,
        borderRadius: 18,
        border: `1.5px solid ${borderClr}`,
        background: bgGradient,
        isolation: "isolate",
      }}
    >
      {/* ── Texture overlay (z-5) ── */}
      <div className={`pointer-events-none absolute inset-0 z-[5] rounded-[18px] texture-${sv ? `${specialCard}` : tier}`} />

      {/* ── Scan-lines (z-6) ── */}
      <div className="scan-lines pointer-events-none absolute inset-0 z-[6] rounded-[18px]" />

      {/* ── Spotlight ray (z-8) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[8]"
        style={{ background: spotlightGradients[tier] }}
      />

      {/* ── Shimmer sweep (z-10) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[10] overflow-hidden rounded-[18px]"
      >
        <div
          className="absolute -left-1/2 -top-1/2 h-[200%] w-[25%] rotate-[20deg]"
          style={{
            background: `linear-gradient(90deg, transparent, ${sv ? sv.accentHex + "18" : cv.shimmerColor}, transparent)`,
            animation: "shimmer-sweep 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Silver sweep — Argent only (z-12) ── */}
      {hasSilverSweep && (
        <div className="pointer-events-none absolute inset-0 z-[12] overflow-hidden rounded-[18px]">
          <div
            className="absolute -left-1/2 -top-1/2 h-[200%] w-[30%] rotate-[12deg]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(200,210,228,0.12) 30%, rgba(255,255,255,0.16) 50%, rgba(200,210,228,0.12) 70%, transparent)",
              animation: "shimmer-sweep 5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* ── Gold sweep — Échappée only (z-12) ── */}
      {specialCard === "totw" && (
        <div className="totw-sweep pointer-events-none absolute inset-0 z-[12] rounded-[18px]" />
      )}

      {/* ── Fire glow — In-Form only (z-4) ── */}
      {specialCard === "in_form" && (
        <div
          className="inform-fire-glow pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-2/5 rounded-b-[18px]"
          style={{
            background: "linear-gradient(to top, rgba(255,60,0,0.15) 0%, rgba(255,107,53,0.06) 40%, transparent 100%)",
          }}
        />
      )}

      {/* ── Holographic scan (z-14) ── */}
      {hasHoloScan && (
        <div className={`holographic-scan rounded-[18px] ${sv ? `holo-scan-${specialCard}` : ""}`} />
      )}

      {/* ── Rainbow overlay (z-16) ── */}
      {hasRainbow && (
        <div className="rainbow-holo pointer-events-none absolute inset-0 z-[16] rounded-[18px] opacity-[0.12]" />
      )}

      {/* ── Floating particles (z-18) ── */}
      {hasParticles && (
        <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden rounded-[18px]">
          {Array.from({ length: pCount }).map((_, i) => {
            const color = pColors[i % pColors.length];
            return (
              <div
                key={i}
                className="particle absolute"
                style={{
                  "--left": `${Math.random() * 100}%`,
                  "--delay": `${Math.random() * 5}s`,
                  "--duration": `${3 + Math.random() * 4}s`,
                  background: color,
                  width: `${2 + Math.random() * 2}px`,
                  height: `${2 + Math.random() * 2}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* ── CONTENT (z-20) ── */}
      <div className="relative z-20 flex h-full flex-col items-center">

        {/* Crest — V-shaped shield at top */}
        <div
          className="absolute -top-px left-1/2 z-[25] -translate-x-1/2"
          style={{ width: 100, height: 46 }}
        >
          <div
            className="flex h-full w-full items-start justify-center pt-[7px]"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 85% 100%, 50% 80%, 15% 100%)",
              background: crestGrad,
            }}
          >
            <span
              className="font-['Space_Grotesk'] text-[7px] font-bold tracking-[0.3em]"
              style={{ color: crestTxtClr }}
            >
              VELOCARD
            </span>
          </div>
        </div>

        {/* Special card pill (top-right) */}
        {sv && (
          <div
            className="absolute right-[14px] top-[50px] z-[25] rounded-[10px] px-2 py-[3px] text-[7px] font-extrabold tracking-[0.12em]"
            style={{
              color: sv.accentHex,
              background: bgGradient,
              border: `1px solid ${sv.borderRgba}`,
            }}
          >
            {sv.pillLabel}
          </div>
        )}

        {/* Left & right vertical lines */}
        <div
          className="pointer-events-none absolute left-3 z-[3]"
          style={{
            top: 50, bottom: 50, width: 1,
            background: `linear-gradient(180deg, transparent, ${borderClr}, transparent)`,
          }}
        />
        <div
          className="pointer-events-none absolute right-3 z-[3]"
          style={{
            top: 50, bottom: 50, width: 1,
            background: `linear-gradient(180deg, transparent, ${borderClr}, transparent)`,
          }}
        />

        {/* ── Top section ── */}
        <div className="flex flex-col items-center pt-[50px] w-full">

          {/* OVR score */}
          <div className="text-center mb-1">
            <div
              className="font-['JetBrains_Mono'] text-[44px] font-extrabold leading-none"
              style={{ color: accentHex, textShadow: `0 0 35px ${glowHex}` }}
            >
              {animatedOvr}
            </div>
            <div className="text-[7px] font-bold tracking-[0.3em] text-white/20">
              OVERALL
            </div>
          </div>

          {/* Hexagonal avatar with ring */}
          <div
            className="mb-2"
            style={{
              width: 72, height: 72,
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background: ringGrad,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: `drop-shadow(0 0 16px ${glowHex})`,
            }}
          >
            <div
              style={{
                width: 66, height: 66,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "#0E1828",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatarUrl ? (
                <img
                  src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
                  alt={username}
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="font-['Space_Grotesk'] text-2xl font-extrabold"
                  style={{ color: accentHex }}
                >
                  {username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#F8FAFC]">
            {username}
          </div>

          {/* Country */}
          {country && (
            <div className="mt-[2px] flex items-center gap-1">
              {countryCode === "FR" ? (
                <div
                  className="rounded-[2px]"
                  style={{
                    width: 15, height: 11,
                    background: "linear-gradient(90deg, #002395 0% 33%, #fff 33% 66%, #ED2939 66% 100%)",
                    boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)",
                  }}
                />
              ) : (
                <div
                  className="rounded-[2px] bg-white/10"
                  style={{ width: 15, height: 11, boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}
                />
              )}
              <span className="text-[8px] font-semibold text-white/30 tracking-[0.04em]">
                {country}
              </span>
            </div>
          )}

          {/* Tier label */}
          <div
            className="text-[8px] font-bold tracking-[0.25em] mt-[3px]"
            style={{ color: accentHex, opacity: 0.4 }}
          >
            {sv ? `${sv.pillLabel} · ${cv.label}` : cv.label}
          </div>

          {/* Divider */}
          <div
            className="mx-auto mt-[10px] mb-[6px]"
            style={{
              width: "50%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${dividerClr}, transparent)`,
            }}
          />
        </div>

        {/* ── Circular Gauges 3×2 ── */}
        <div className="grid w-full grid-cols-3 gap-1 px-[14px]">
          {([
            { label: "VIT", value: stats.pac },
            { label: "MON", value: stats.mon },
            { label: "TEC", value: stats.val },
            { label: "SPR", value: stats.spr },
            { label: "END", value: stats.end },
            { label: "PUI", value: stats.res },
          ] as const).map((s) => (
            <CircularGauge
              key={s.label}
              label={s.label}
              value={s.value}
              accentHex={accentHex}
              glowHex={glowHex}
              statColor={statClr}
              gaugeBgStroke={gaugeBg}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div
          className="mx-auto mb-1"
          style={{
            width: "50%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${dividerClr}, transparent)`,
            opacity: 0.5,
          }}
        />
        <div className="pb-3 text-[7px] tracking-[0.2em] text-white/[0.08]">
          VELOCARD.APP
        </div>
      </div>
    </div>
  );
}
