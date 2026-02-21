"use client";

import { memo, useRef } from "react";
import { useGyroscope } from "@/hooks/useGyroscope";
import type { ComputedStats, CardTier, Badge, ClubInfo, SpecialCardType } from "@/types";
import VeloCard from "./VeloCard";

interface VeloCardInteractiveProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs?: ClubInfo[];
  country?: string;
  countryCode?: string;
  specialCard?: SpecialCardType | null;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

const tierAccentRgb: Record<CardTier, string> = {
  bronze: "232,168,84",
  argent: "184,160,216",
  platine: "224,232,240",
  diamant: "0,212,255",
  legende: "255,215,0",
};

export default memo(function VeloCardInteractive({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  country,
  countryCode,
  specialCard,
}: VeloCardInteractiveProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { tilt } = useGyroscope(wrapperRef);

  const tiltIntensity = Math.abs(tilt.rotateX) + Math.abs(tilt.rotateY);

  // Dynamic holo overlay — angle & intensity react to tilt
  const holoStyle = {
    background: `
      linear-gradient(
        ${130 + tilt.rotateY * 3}deg,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,${0.03 + tiltIntensity * 0.008}) 30%,
        ${tierAccentHex[tier]}22 50%,
        rgba(255,255,255,${0.03 + tiltIntensity * 0.008}) 70%,
        rgba(255,255,255,0) 100%
      )
    `,
    mixBlendMode: "color-dodge" as const,
    transition: "background 0.15s ease-out",
  };

  // Specular highlight — moves with tilt
  const specularStyle = {
    background: `radial-gradient(
      ellipse at ${50 + tilt.rotateY * 4}% ${50 - tilt.rotateX * 4}%,
      rgba(255,255,255,${0.12 + tiltIntensity * 0.015}) 0%,
      rgba(255,255,255,0.02) 40%,
      transparent 70%
    )`,
    transition: "background 0.1s ease-out",
  };

  // Edge light — bord lumineux qui suit l'inclinaison
  const edgeLightStyle = {
    boxShadow: `
      ${-tilt.rotateY * 0.5}px ${-tilt.rotateX * 0.5}px 20px rgba(${tierAccentRgb[tier]}, ${0.1 + tiltIntensity * 0.01}),
      0 0 40px rgba(${tierAccentRgb[tier]}, 0.05)
    `,
  };

  // Dynamic shadow — bouge avec le tilt
  const shadowStyle = {
    boxShadow: `
      ${tilt.rotateY * 1.5}px ${tilt.rotateX * 1.5 + 15}px 40px -10px rgba(0,0,0,0.6),
      ${tilt.rotateY * 0.5}px ${tilt.rotateX * 0.5 + 8}px 20px -5px rgba(0,0,0,0.3)
    `,
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* Glow ambiant derriere la carte */}
      <div
        className="absolute rounded-[24px] blur-[50px] opacity-25 -z-10"
        style={{
          width: 280,
          height: 470,
          background: `radial-gradient(ellipse at center, rgba(${tierAccentRgb[tier]}, 0.5), transparent 70%)`,
          transform: "scale(1.2)",
        }}
      />

      {/* 3D perspective wrapper */}
      <div
        ref={wrapperRef}
        style={{ perspective: "800px", width: 280 }}
        className="relative"
      >
        {/* Dynamic shadow layer */}
        <div
          className="absolute inset-0 rounded-[18px] -z-10"
          style={shadowStyle}
        />

        {/* Tilt container */}
        <div
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.08s linear",
            ...edgeLightStyle,
            borderRadius: 18,
          }}
          className="relative"
        >
          {/* The actual card */}
          <VeloCard
            username={username}
            avatarUrl={avatarUrl}
            stats={stats}
            tier={tier}
            badges={badges}
            clubs={clubs}
            country={country}
            countryCode={countryCode}
            specialCard={specialCard}
          />

          {/* Holographic overlay — reacts to tilt */}
          <div
            data-holo="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-[18px]"
            style={holoStyle}
          />

          {/* Specular highlight — moves with tilt */}
          <div
            data-holo="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-[18px]"
            style={specularStyle}
          />
        </div>
      </div>
    </div>
  );
});
