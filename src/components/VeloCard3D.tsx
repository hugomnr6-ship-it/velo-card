"use client";

import Tilt from "react-parallax-tilt";
import VeloCard from "./VeloCard";
import type { ComputedStats, CardTier, Badge, ClubInfo, SpecialCardType } from "@/types";

interface VeloCard3DProps {
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

/* Tier-specific tilt/glare config — higher tiers get more dramatic effects */
const tierTiltConfig: Record<CardTier, { tiltX: number; tiltY: number; glare: number; glareColor: string; scale: number; perspective: number }> = {
  bronze:  { tiltX: 8,  tiltY: 8,  glare: 0.1,  glareColor: "#E8A854", scale: 1.01, perspective: 1200 },
  argent:  { tiltX: 10, tiltY: 10, glare: 0.15, glareColor: "#B8A0D8", scale: 1.01, perspective: 1100 },
  platine: { tiltX: 12, tiltY: 12, glare: 0.2,  glareColor: "#E0E8F0", scale: 1.02, perspective: 1000 },
  diamant: { tiltX: 15, tiltY: 15, glare: 0.35, glareColor: "#00D4FF", scale: 1.03, perspective: 900 },
  legende: { tiltX: 18, tiltY: 18, glare: 0.45, glareColor: "#FFD700", scale: 1.04, perspective: 800 },
};

export default function VeloCard3D(props: VeloCard3DProps) {
  const cfg = tierTiltConfig[props.tier] || tierTiltConfig.bronze;

  return (
    <Tilt
      gyroscope={true}
      tiltMaxAngleX={cfg.tiltX}
      tiltMaxAngleY={cfg.tiltY}
      glareEnable={true}
      glareMaxOpacity={cfg.glare}
      glareColor={cfg.glareColor}
      glarePosition="all"
      glareBorderRadius="18px"
      perspective={cfg.perspective}
      transitionSpeed={1500}
      scale={cfg.scale}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <VeloCard {...props} />
    </Tilt>
  );
}
