"use client";

import { useRef } from "react";
import { useGyroscope } from "@/hooks/useGyroscope";
import type { ComputedStats, CardTier, Badge } from "@/types";
import VeloCard from "./VeloCard";

interface VeloCardInteractiveProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubName?: string | null;
  clubLogoUrl?: string | null;
}

const tierHoloColors: Record<CardTier, string> = {
  bronze:
    "linear-gradient(135deg, rgba(255,140,50,0.05) 0%, rgba(255,200,100,0.08) 25%, rgba(255,100,50,0.04) 50%, rgba(255,220,150,0.06) 75%, rgba(255,140,50,0.05) 100%)",
  silver:
    "linear-gradient(135deg, rgba(150,180,255,0.05) 0%, rgba(200,220,255,0.08) 25%, rgba(150,200,255,0.04) 50%, rgba(220,240,255,0.06) 75%, rgba(150,180,255,0.05) 100%)",
  gold: "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,240,100,0.09) 25%, rgba(255,200,0,0.05) 50%, rgba(255,250,150,0.07) 75%, rgba(255,215,0,0.06) 100%)",
};

export default function VeloCardInteractive({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubName,
  clubLogoUrl,
}: VeloCardInteractiveProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { tilt } = useGyroscope(wrapperRef);

  // Compute holo angle from tilt for dynamic color shift
  const holoAngle = 135 + tilt.rotateY * 3 + tilt.rotateX * 2;
  const holoOpacity =
    0.1 +
    (Math.abs(tilt.rotateX) + Math.abs(tilt.rotateY)) * 0.005;

  return (
    <div className="flex flex-col items-center">
      {/* 3D perspective wrapper — NOT captured by export */}
      <div
        ref={wrapperRef}
        style={{ perspective: "800px" }}
        className="relative"
      >
        {/* Tilt container */}
        <div
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.08s linear",
          }}
          className="relative"
        >
          {/* The actual card — this is what gets captured by toPng */}
          <VeloCard
            username={username}
            avatarUrl={avatarUrl}
            stats={stats}
            tier={tier}
            badges={badges}
            clubName={clubName}
            clubLogoUrl={clubLogoUrl}
          />

          {/* Holographic overlay — filtered out during export */}
          <div
            data-holo="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
            style={{
              background: tierHoloColors[tier],
              backgroundImage: `linear-gradient(${holoAngle}deg,
                rgba(255,0,0,0.02),
                rgba(255,165,0,0.03),
                rgba(255,255,0,0.02),
                rgba(0,255,0,0.03),
                rgba(0,100,255,0.02),
                rgba(150,0,255,0.03),
                rgba(255,0,0,0.02))`,
              opacity: holoOpacity,
              mixBlendMode: "color-dodge",
            }}
          />

          {/* Specular highlight — moves with tilt */}
          <div
            data-holo="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
            style={{
              background: `radial-gradient(
                ellipse at ${50 + tilt.rotateY * 2}% ${50 - tilt.rotateX * 2}%,
                rgba(255,255,255,0.05) 0%,
                transparent 60%
              )`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
