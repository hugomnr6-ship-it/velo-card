"use client";

import { useState, useEffect } from "react";
import VeloCardInteractive from "@/components/VeloCardInteractive";
import CardWidget from "@/components/CardWidget";
import DownloadButton from "@/components/DownloadButton";
import LevelUpToast from "@/components/LevelUpToast";
import RouteAnalysisSection from "./RouteAnalysisSection";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs?: ClubInfo[];
  userId: string;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  userId,
}: VeloCardClientProps) {
  const [previousTier, setPreviousTier] = useState<CardTier | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("velocard-prev-tier") as CardTier | null;
    if (stored && stored !== tier) {
      setPreviousTier(stored);
    }
    sessionStorage.setItem("velocard-prev-tier", tier);
  }, [tier]);

  return (
    <>
      <LevelUpToast previousTier={previousTier} currentTier={tier} />

      {/* Compact card widget — quick overview */}
      <CardWidget
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        userId={userId}
      />

      {/* Full interactive card */}
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubs={clubs}
      />
      <DownloadButton tier={tier} userId={userId} />
      <RouteAnalysisSection tier={tier} />
    </>
  );
}
