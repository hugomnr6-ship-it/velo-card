"use client";

import { useState, useEffect } from "react";
import VeloCardInteractive from "@/components/VeloCardInteractive";
import CardWidget from "@/components/CardWidget";
import DownloadButton from "@/components/DownloadButton";
import LevelUpToast from "@/components/LevelUpToast";
import MondayUpdateBanner from "@/components/MondayUpdateBanner";
import RouteAnalysisSection from "./RouteAnalysisSection";
import DashboardFeed from "./DashboardFeed";
import type { ComputedStats, CardTier, Badge, ClubInfo, StatDeltas, SpecialCardType } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs?: ClubInfo[];
  userId: string;
  deltas?: StatDeltas | null;
  specialCard?: SpecialCardType | null;
  streak?: number;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  userId,
  deltas,
  specialCard,
  streak = 0,
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

      {/* Monday Update Banner — shows deltas if available */}
      {deltas && deltas.ovr !== 0 && (
        <MondayUpdateBanner deltas={deltas} specialCard={specialCard} streak={streak} />
      )}

      {/* Compact card widget — quick overview */}
      <CardWidget
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        userId={userId}
        deltas={deltas}
      />

      {/* Full interactive card */}
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubs={clubs}
        specialCard={specialCard}
      />
      <DownloadButton tier={tier} userId={userId} />

      {/* Dashboard feed — weekly stats, Échappée teaser, quick links */}
      <DashboardFeed userId={userId} tier={tier} />

      <RouteAnalysisSection tier={tier} />
    </>
  );
}
