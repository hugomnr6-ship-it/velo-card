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

/* ——— Tier-specific config (V2 — Brushed metal premium) ——— */
const tierConfig: Record<
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
    bg: "from-[#120c04] via-[#1e1209] to-[#2a1a0d]",
    accent: "text-[#cd7f32]",
    accentLight: "text-[#daa06d]",
    glowClass: "card-glow-bronze",
    avatarGlow: "avatar-glow-bronze",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(205,127,50,0.18) 50%, transparent 70%)",
    label: "BRONZE",
  },
  silver: {
    bg: "from-[#0c1018] via-[#151c28] to-[#1e2a3a]",
    accent: "text-[#bdc3c7]",
    accentLight: "text-[#e2e8f0]",
    glowClass: "card-glow-silver",
    avatarGlow: "avatar-glow-silver",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(189,195,199,0.15) 50%, transparent 70%)",
    label: "SILVER",
  },
  gold: {
    bg: "from-[#141004] via-[#221a06] to-[#302208]",
    accent: "text-[#ffd700]",
    accentLight: "text-[#ffe44d]",
    glowClass: "card-glow-gold",
    avatarGlow: "avatar-glow-gold",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(255,215,0,0.22) 50%, transparent 70%)",
    label: "GOLD",
  },
};

const tierBorderColors: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40",
  silver: "border-[#bdc3c7]/30",
  gold: "border-[#ffd700]/40",
};

const tierDividerColors: Record<CardTier, string> = {
  bronze: "from-transparent via-[#cd7f32]/50 to-transparent",
  silver: "from-transparent via-[#bdc3c7]/40 to-transparent",
  gold: "from-transparent via-[#ffd700]/60 to-transparent",
};

const tierAvatarRing: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]",
  silver: "border-[#bdc3c7]",
  gold: "border-[#ffd700]",
};

/* ——— Badge styles: dark opaque pill ——— */
const tierBadgeStyles: Record<CardTier, string> = {
  bronze: "border-[1.5px] border-[#cd7f32]/60 bg-[#1a1108]/90",
  silver: "border-[1.5px] border-[#bdc3c7]/50 bg-[#10141d]/90",
  gold: "border-[1.5px] border-[#ffd700]/60 bg-[#1c1804]/90",
};

/* ——— Spotlight: diagonal light ray across card ——— */
const spotlightGradients: Record<CardTier, string> = {
  bronze:
    "linear-gradient(135deg, transparent 20%, rgba(205,127,50,0.08) 35%, rgba(255,255,255,0.12) 50%, rgba(205,127,50,0.08) 65%, transparent 80%)",
  silver:
    "linear-gradient(135deg, transparent 20%, rgba(189,195,199,0.10) 35%, rgba(255,255,255,0.18) 50%, rgba(189,195,199,0.10) 65%, transparent 80%)",
  gold:
    "linear-gradient(135deg, transparent 20%, rgba(255,215,0,0.10) 35%, rgba(255,255,255,0.15) 50%, rgba(255,215,0,0.10) 65%, transparent 80%)",
};

/* ——— Avatar outer ring gradient (3D lighting) ——— */
const tierRingGradient: Record<CardTier, string> = {
  bronze:
    "linear-gradient(180deg, rgba(205,127,50,0.8), rgba(205,127,50,0.3))",
  silver:
    "linear-gradient(180deg, rgba(220,225,230,0.7), rgba(150,160,170,0.3))",
  gold: "linear-gradient(180deg, rgba(255,215,0,0.8), rgba(255,170,0,0.3))",
};

/* ——— Tier pill (top-right label) ——— */
const tierPillBg: Record<CardTier, string> = {
  bronze: "rgba(20,12,5,0.8)",
  silver: "rgba(15,20,30,0.8)",
  gold: "rgba(25,20,5,0.8)",
};
const tierPillBorder: Record<CardTier, string> = {
  bronze: "rgba(205,127,50,0.4)",
  silver: "rgba(189,195,199,0.3)",
  gold: "rgba(255,215,0,0.4)",
};

/* ——— Hex stat configs ——— */
const tierOuterBorderColor: Record<CardTier, string> = {
  bronze: "rgba(205,127,50,0.25)",
  silver: "rgba(189,195,199,0.20)",
  gold: "rgba(255,215,0,0.30)",
};
const tierHexBg: Record<CardTier, string> = {
  bronze:
    "linear-gradient(180deg, rgba(30,20,10,0.9), rgba(20,12,5,0.95))",
  silver:
    "linear-gradient(180deg, rgba(25,30,40,0.9), rgba(15,20,30,0.95))",
  gold: "linear-gradient(180deg, rgba(30,25,10,0.9), rgba(20,15,5,0.95))",
};
const tierValueColors: Record<CardTier, string> = {
  bronze: "text-[#daa06d]",
  silver: "text-[#e2e8f0]",
  gold: "text-[#ffe44d]",
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
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/40">
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
          <p className="mt-4 text-xl font-bold tracking-wide text-white">
            {username}
          </p>
          <p
            className={`mt-1 text-[10px] font-semibold tracking-[0.25em] ${config.accent} opacity-70`}
          >
            {config.label} TIER
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
          className={`mt-6 h-px w-full bg-gradient-to-r ${tierDividerColors[tier]}`}
        />

        {/* ——— Stats row 1: PAC / END / GRIM ——— */}
        <div className="mt-8 flex w-full justify-center gap-5">
          {(
            [
              { label: "PAC", value: stats.pac },
              { label: "END", value: stats.end },
              { label: "GRIM", value: stats.grim },
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

        {/* ——— Stats row 2: PUI / EXP / TEC ——— */}
        <div className="mt-5 flex w-full justify-center gap-5">
          {(
            [
              { label: "PUI", value: stats.pui },
              { label: "EXP", value: stats.exp },
              { label: "TEC", value: stats.tec },
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
function StatHex({
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
            className={`text-2xl font-black ${isElite ? "text-yellow-200" : tierValueColors[tier]}`}
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
