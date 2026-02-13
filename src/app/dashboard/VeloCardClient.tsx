"use client";

import VeloCardInteractive from "@/components/VeloCardInteractive";
import DownloadButton from "@/components/DownloadButton";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs?: ClubInfo[];
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
}: VeloCardClientProps) {
  return (
    <>
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubs={clubs}
      />
      <DownloadButton tier={tier} />
    </>
  );
}
