"use client";

import { useState, useEffect } from "react";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

interface VeloCardProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges?: Badge[];
  clubs?: ClubInfo[];
}

/* ——— Tier-specific config (5 tiers premium) ——— */
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
  }
> = {
  bronze: {
    bg: "from-[#1A1208] via-[#2D1F0E] to-[#1A1208]",
    accent: "text-[#cd7f32]",
    accentLight: "text-[#daa06d]",
    glowClass: "card-glow-bronze",
    avatarGlow: "avatar-glow-bronze",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(205,127,50,0.18) 50%, transparent 70%)",
    label: "BRONZE",
  },
  argent: {
    bg: "from-[#14141E] via-[#1E1E2E] to-[#14141E]",
    accent: "text-[#C0C0C0]",
    accentLight: "text-[#e2e8f0]",
    glowClass: "card-glow-argent",
    avatarGlow: "avatar-glow-argent",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(192,192,192,0.15) 50%, transparent 70%)",
    label: "ARGENT",
  },
  platine: {
    bg: "from-[#1A1A2E] via-[#2A2A42] to-[#1A1A2E]",
    accent: "text-[#E5E4E2]",
    accentLight: "text-[#A8D8EA]",
    glowClass: "card-glow-platine",
    avatarGlow: "avatar-glow-platine",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(168,216,234,0.15) 50%, transparent 70%)",
    label: "PLATINE",
  },
  diamant: {
    bg: "from-[#0A1628] via-[#162040] to-[#0A1628]",
    accent: "text-[#B9F2FF]",
    accentLight: "text-[#d4f8ff]",
    glowClass: "card-glow-diamant",
    avatarGlow: "avatar-glow-diamant",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(185,242,255,0.18) 50%, transparent 70%)",
    label: "DIAMANT",
  },
  legende: {
    bg: "from-[#1A0A2E] via-[#2E1A0A] to-[#0A2E1A]",
    accent: "text-[#FFD700]",
    accentLight: "text-[#ffe44d]",
    glowClass: "card-glow-legende",
    avatarGlow: "avatar-glow-legende",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(255,215,0,0.22) 50%, transparent 70%)",
    label: "LEGENDE",
  },
};

export const tierBorderColors: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40",
  argent: "border-[#C0C0C0]/30",
  platine: "border-[#A8D8EA]/30",
  diamant: "border-[#B9F2FF]/30",
  legende: "border-[#ffd700]/40",
};

export const tierDividerColors: Record<CardTier, string> = {
  bronze: "from-transparent via-[#cd7f32]/50 to-transparent",
  argent: "from-transparent via-[#C0C0C0]/40 to-transparent",
  platine: "from-transparent via-[#A8D8EA]/40 to-transparent",
  diamant: "from-transparent via-[#B9F2FF]/50 to-transparent",
  legende: "from-transparent via-[#ffd700]/60 to-transparent",
};

const tierAvatarRing: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]",
  argent: "border-[#C0C0C0]",
  platine: "border-[#A8D8EA]",
  diamant: "border-[#B9F2FF]",
  legende: "border-[#ffd700]",
};

/* ——— Badge styles: dark opaque pill ——— */
const tierBadgeStyles: Record<CardTier, string> = {
  bronze: "border-[1.5px] border-[#cd7f32]/60 bg-[#1a1108]/90",
  argent: "border-[1.5px] border-[#C0C0C0]/50 bg-[#10141d]/90",
  platine: "border-[1.5px] border-[#A8D8EA]/50 bg-[#14142a]/90",
  diamant: "border-[1.5px] border-[#B9F2FF]/50 bg-[#0a1628]/90",
  legende: "border-[1.5px] border-[#ffd700]/60 bg-[#1c1804]/90",
};

/* ——— Spotlight: diagonal light ray across card ——— */
export const spotlightGradients: Record<CardTier, string> = {
  bronze:
    "linear-gradient(135deg, transparent 20%, rgba(205,127,50,0.08) 35%, rgba(255,255,255,0.12) 50%, rgba(205,127,50,0.08) 65%, transparent 80%)",
  argent:
    "linear-gradient(135deg, transparent 20%, rgba(192,192,192,0.10) 35%, rgba(255,255,255,0.18) 50%, rgba(192,192,192,0.10) 65%, transparent 80%)",
  platine:
    "linear-gradient(135deg, transparent 20%, rgba(168,216,234,0.10) 35%, rgba(255,255,255,0.15) 50%, rgba(168,216,234,0.10) 65%, transparent 80%)",
  diamant:
    "linear-gradient(135deg, transparent 20%, rgba(185,242,255,0.10) 35%, rgba(255,255,255,0.18) 50%, rgba(185,242,255,0.10) 65%, transparent 80%)",
  legende:
    "linear-gradient(135deg, transparent 20%, rgba(255,215,0,0.10) 35%, rgba(255,255,255,0.15) 50%, rgba(255,215,0,0.10) 65%, transparent 80%)",
};

/* ——— Avatar outer ring gradient (3D lighting) ——— */
const tierRingGradient: Record<CardTier, string> = {
  bronze:
    "linear-gradient(180deg, rgba(205,127,50,0.8), rgba(205,127,50,0.3))",
  argent:
    "linear-gradient(180deg, rgba(192,192,192,0.7), rgba(150,150,150,0.3))",
  platine:
    "linear-gradient(180deg, rgba(168,216,234,0.7), rgba(229,228,226,0.3))",
  diamant:
    "linear-gradient(180deg, rgba(185,242,255,0.8), rgba(185,242,255,0.3))",
  legende:
    "linear-gradient(180deg, rgba(255,215,0,0.8), rgba(255,170,0,0.3))",
};

/* ——— Tier pill (top-right label) ——— */
export const tierPillBg: Record<CardTier, string> = {
  bronze: "rgba(20,12,5,0.8)",
  argent: "rgba(15,15,25,0.8)",
  platine: "rgba(20,20,35,0.8)",
  diamant: "rgba(10,22,40,0.8)",
  legende: "rgba(25,20,5,0.8)",
};
export const tierPillBorder: Record<CardTier, string> = {
  bronze: "rgba(205,127,50,0.4)",
  argent: "rgba(192,192,192,0.3)",
  platine: "rgba(168,216,234,0.3)",
  diamant: "rgba(185,242,255,0.4)",
  legende: "rgba(255,215,0,0.4)",
};

/* ——— Hex stat configs ——— */
export const tierOuterBorderColor: Record<CardTier, string> = {
  bronze: "rgba(205,127,50,0.25)",
  argent: "rgba(192,192,192,0.20)",
  platine: "rgba(168,216,234,0.25)",
  diamant: "rgba(185,242,255,0.25)",
  legende: "rgba(255,215,0,0.30)",
};
export const tierHexBg: Record<CardTier, string> = {
  bronze:
    "linear-gradient(180deg, rgba(30,20,10,0.9), rgba(20,12,5,0.95))",
  argent:
    "linear-gradient(180deg, rgba(25,25,35,0.9), rgba(15,15,25,0.95))",
  platine:
    "linear-gradient(180deg, rgba(25,25,40,0.9), rgba(20,20,35,0.95))",
  diamant:
    "linear-gradient(180deg, rgba(15,25,45,0.9), rgba(10,20,35,0.95))",
  legende:
    "linear-gradient(180deg, rgba(30,25,10,0.9), rgba(20,15,5,0.95))",
};
export const tierValueColors: Record<CardTier, string> = {
  bronze: "text-[#daa06d]",
  argent: "text-[#e2e8f0]",
  platine: "text-[#A8D8EA]",
  diamant: "text-[#B9F2FF]",
  legende: "text-[#ffe44d]",
};

export default function VeloCard({
  username,
  avatarUrl,
  stats,
  tier,
  badges = [],
  clubs = [],
}: VeloCardProps) {
  const config = tierConfig[tier];

  // Rotating club logo index (cycles every 3s if multiple clubs)
  const [clubIndex, setClubIndex] = useState(0);

  useEffect(() => {
    if (clubs.length <= 1) return;
    const interval = setInterval(() => {
      setClubIndex((prev) => (prev + 1) % clubs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [clubs.length]);

  const currentClub = clubs.length > 0 ? clubs[clubIndex] : null;

  return (
    <div
      id="velo-card"
      className={`relative w-[400px] h-[711px] rounded-2xl border-[1.5px] bg-gradient-to-b overflow-hidden ${config.bg} ${tierBorderColors[tier]} ${config.glowClass}`}
    >
      {/* Tier texture overlay — brushed metal circulaire (z-5) */}
      <div
        className={`pointer-events-none absolute inset-0 z-[5] rounded-2xl texture-${tier}`}
      />

      {/* Scan-lines overlay (z-10) */}
      <div className="scan-lines pointer-events-none absolute inset-0 z-10 rounded-2xl" />

      {/* Spotlight — diagonal light ray (z-15) */}
      <div
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{ background: spotlightGradients[tier] }}
      />

      {/* Content (z-20) */}
      <div className="relative z-20 flex h-full flex-col items-center px-6 pt-6 pb-5">
        {/* ——— Top bar: branding + centered club logo + tier pill ——— */}
        <div className="relative flex w-full items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 font-[var(--font-title)]">
            VELOCARD
          </span>

          {/* Club logo — centered absolutely */}
          {currentClub && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <img
                src={`/api/img?url=${encodeURIComponent(currentClub.logo_url)}`}
                alt={currentClub.name}
                crossOrigin="anonymous"
                className="h-7 w-7 rounded-full border border-white/20 object-cover transition-opacity duration-500"
                title={currentClub.name}
                key={currentClub.logo_url}
              />
            </div>
          )}

          {/* Tier pill — 3D encapsulated */}
          <span
            className={`shimmer rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.2em] ${config.accent}`}
            style={{
              backgroundImage: config.shimmerGradient,
              backgroundColor: tierPillBg[tier],
              border: `1px solid ${tierPillBorder[tier]}`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {config.label}
          </span>
        </div>

        {/* ——— Avatar with double ring 3D ——— */}
        <div className="mt-8 flex flex-col items-center">
          {/* Outer glow ring — tier-colored gradient */}
          <div
            className={`rounded-full p-[3px] ${config.avatarGlow}`}
            style={{ background: tierRingGradient[tier] }}
          >
            {/* Inner white ring */}
            <div className="relative rounded-full border-[3px] border-white/20 p-[2px]">
              {avatarUrl ? (
                <img
                  src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
                  alt={username}
                  crossOrigin="anonymous"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/10" />
              )}
              {/* Rim light overlay — white arc on top for 3D effect */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 40%)",
                }}
              />
            </div>
          </div>

          {/* Username + tier */}
          <p className="mt-4 text-xl font-bold tracking-wide text-white font-['Space_Grotesk']">
            {username}
          </p>
          <p
            className={`mt-1 text-[10px] font-semibold tracking-[0.25em] ${config.accent} opacity-70`}
          >
            {config.label} TIER
          </p>

          {/* ——— OVR Display ——— */}
          <p
            className={`mt-3 text-[48px] font-black leading-none ${config.accent} font-['JetBrains_Mono']`}
          >
            {stats.ovr}
          </p>

          {/* ——— PlayStyle Badges (Dark glossy pills) ——— */}
          {badges.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative overflow-hidden flex items-center gap-1 rounded-full px-2.5 py-0.5 ${tierBadgeStyles[tier]}`}
                  style={{
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                  title={badge.name}
                >
                  {/* Glossy shine overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 45%)",
                    }}
                  />
                  <span className="text-xs">{badge.emoji}</span>
                  <span className="relative text-[9px] font-bold tracking-wide text-white/90">
                    {badge.name.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ——— Divider ——— */}
        <div
          className={`mt-4 h-px w-full bg-gradient-to-r ${tierDividerColors[tier]}`}
        />

        {/* ——— Stats row 1: PAC / MON / VAL ——— */}
        <div className="mt-5 flex w-full justify-center gap-5">
          {(
            [
              { label: "PAC", value: stats.pac },
              { label: "MON", value: stats.mon },
              { label: "VAL", value: stats.val },
            ] as const
          ).map((s) => (
            <StatHex
              key={s.label}
              label={s.label}
              value={s.value}
              tier={tier}
            />
          ))}
        </div>

        {/* ——— Stats row 2: SPR / END / RES ——— */}
        <div className="mt-3 flex w-full justify-center gap-5">
          {(
            [
              { label: "SPR", value: stats.spr },
              { label: "END", value: stats.end },
              { label: "RES", value: stats.res },
            ] as const
          ).map((s) => (
            <StatHex
              key={s.label}
              label={s.label}
              value={s.value}
              tier={tier}
            />
          ))}
        </div>

        {/* ——— Spacer ——— */}
        <div className="flex-1" />

        {/* ——— Bottom divider + branding ——— */}
        <div
          className={`h-px w-3/4 bg-gradient-to-r ${tierDividerColors[tier]} opacity-50`}
        />
        <p className="mt-3 text-[9px] tracking-[0.2em] text-white/20">
          VELOCARD.APP
        </p>
      </div>
    </div>
  );
}

/* ——— Hexagonal stat badge — 3D double border ——— */
export function StatHex({
  label,
  value,
  tier,
}: {
  label: string;
  value: number;
  tier: CardTier;
}) {
  const isElite = value >= 90;

  return (
    <div className="flex h-[100px] w-[90px] flex-col items-center justify-center">
      {/* Outer border hex */}
      <div
        className="stat-badge flex items-center justify-center"
        style={{
          width: 79,
          height: 84,
          background: isElite
            ? "linear-gradient(180deg, rgba(255,215,0,0.6), rgba(255,170,0,0.4))"
            : tierOuterBorderColor[tier],
        }}
      >
        {/* Inner hex — dark glassmorphism */}
        <div
          className={`stat-badge flex h-[76px] w-[71px] flex-col items-center justify-center ${isElite ? "stat-elite" : ""}`}
          style={{
            background: tierHexBg[tier],
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.3)${isElite ? ", 0 0 12px rgba(255,215,0,0.4)" : ""}`,
          }}
        >
          <span
            className={`text-2xl font-black font-['JetBrains_Mono'] ${isElite ? "text-yellow-200" : tierValueColors[tier]}`}
          >
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
