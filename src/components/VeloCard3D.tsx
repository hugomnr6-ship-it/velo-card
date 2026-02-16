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

// Config AGRESSIVE par tier — plus c'est haut, plus c'est dramatique
const tierTiltConfig: Record<
  CardTier,
  {
    tiltMaxAngleX: number;
    tiltMaxAngleY: number;
    glareMaxOpacity: number;
    glareColor: string;
    scale: number;
    perspective: number;
    transitionSpeed: number;
  }
> = {
  bronze: {
    tiltMaxAngleX: 12,
    tiltMaxAngleY: 12,
    glareMaxOpacity: 0.15,
    glareColor: "rgba(232,168,84,0.4)",
    scale: 1.02,
    perspective: 1200,
    transitionSpeed: 400,
  },
  argent: {
    tiltMaxAngleX: 14,
    tiltMaxAngleY: 14,
    glareMaxOpacity: 0.25,
    glareColor: "rgba(184,160,216,0.5)",
    scale: 1.03,
    perspective: 1100,
    transitionSpeed: 500,
  },
  platine: {
    tiltMaxAngleX: 16,
    tiltMaxAngleY: 16,
    glareMaxOpacity: 0.35,
    glareColor: "rgba(224,232,240,0.5)",
    scale: 1.04,
    perspective: 1000,
    transitionSpeed: 600,
  },
  diamant: {
    tiltMaxAngleX: 20,
    tiltMaxAngleY: 20,
    glareMaxOpacity: 0.45,
    glareColor: "rgba(0,212,255,0.6)",
    scale: 1.05,
    perspective: 900,
    transitionSpeed: 700,
  },
  legende: {
    tiltMaxAngleX: 25,
    tiltMaxAngleY: 25,
    glareMaxOpacity: 0.6,
    glareColor: "rgba(255,215,0,0.7)",
    scale: 1.06,
    perspective: 800,
    transitionSpeed: 800,
  },
};

export default function VeloCard3D(props: VeloCard3DProps) {
  const config = tierTiltConfig[props.tier];

  return (
    <div className="relative">
      {/* Glow ambiant derriere la carte */}
      <div
        className="absolute inset-0 rounded-[24px] blur-[60px] opacity-30 -z-10"
        style={{
          background: `radial-gradient(ellipse at center, ${config.glareColor}, transparent 70%)`,
          transform: "scale(1.3)",
        }}
      />

      {/* Ombre portee realiste multicouche */}
      <div
        className="absolute inset-0 rounded-[20px] -z-20"
        style={{
          boxShadow: `
            0 20px 60px -15px rgba(0,0,0,0.8),
            0 10px 30px -10px rgba(0,0,0,0.5),
            0 0 40px -5px ${config.glareColor}
          `,
          transform: "translateY(8px) scale(0.95)",
        }}
      />

      <Tilt
        tiltMaxAngleX={config.tiltMaxAngleX}
        tiltMaxAngleY={config.tiltMaxAngleY}
        perspective={config.perspective}
        scale={config.scale}
        transitionSpeed={config.transitionSpeed}
        gyroscope={true}
        glareEnable={true}
        glareMaxOpacity={config.glareMaxOpacity}
        glareColor={config.glareColor}
        glareBorderRadius="18px"
        glarePosition="all"
        tiltReverse={false}
        trackOnWindow={false}
        className="transform-gpu will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Couche de profondeur — la carte flotte au-dessus du fond */}
        <div style={{ transform: "translateZ(30px)" }}>
          <VeloCard
            username={props.username}
            avatarUrl={props.avatarUrl}
            stats={props.stats}
            tier={props.tier}
            badges={props.badges}
            clubs={props.clubs}
            specialCard={props.specialCard}
          />
        </div>
      </Tilt>
    </div>
  );
}
