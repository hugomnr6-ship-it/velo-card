"use client";

import dynamic from "next/dynamic";
import type { ComputedStats, CardTier, Badge, ClubInfo, SpecialCardType } from "@/types";

const VeloCard3D = dynamic(() => import("./VeloCard3D"), { ssr: false });

interface Props {
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

export default function VeloCard3DWrapper(props: Props) {
  return <VeloCard3D {...props} />;
}
