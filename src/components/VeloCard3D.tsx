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

export default function VeloCard3D(props: VeloCard3DProps) {
  return (
    <Tilt
      gyroscope={true}
      tiltMaxAngleX={12}
      tiltMaxAngleY={12}
      glareEnable={true}
      glareMaxOpacity={0.2}
      glareColor="#ffffff"
      glarePosition="all"
      glareBorderRadius="18px"
      perspective={1000}
      transitionSpeed={1500}
      scale={1.02}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <VeloCard {...props} />
    </Tilt>
  );
}
