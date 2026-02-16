"use client";

import { useState, useEffect } from "react";
import VeloCardInteractive from "@/components/VeloCardInteractive";
import CardWidget from "@/components/CardWidget";
import DownloadButton from "@/components/DownloadButton";
import ShareButton from "@/components/ShareButton";
import LevelUpToast from "@/components/LevelUpToast";
import MondayUpdateBanner from "@/components/MondayUpdateBanner";
import MondayReveal from "@/components/MondayReveal";
import TierProgress from "@/components/TierProgress";
import RouteAnalysisSection from "./RouteAnalysisSection";
import BadgeToast from "@/components/BadgeToast";
import DashboardFeed from "./DashboardFeed";
import { trackEvent } from "@/lib/analytics";
import type { ComputedStats, CardTier, Badge, ClubInfo, StatDeltas, SpecialCardType } from "@/types";

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getCurrentWeekLabel(): string {
  const now = new Date();
  const weekNum = getISOWeek(now);
  const year = now.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

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
  serverPreviousTier?: CardTier | null;
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
  serverPreviousTier,
}: VeloCardClientProps) {
  const [previousTier, setPreviousTier] = useState<CardTier | null>(null);
  const [showMondayReveal, setShowMondayReveal] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("velocard-prev-tier") as CardTier | null;
    if (stored && stored !== tier) {
      setPreviousTier(stored);
    }
    sessionStorage.setItem("velocard-prev-tier", tier);
  }, [tier]);

  // Monday Reveal check
  useEffect(() => {
    try {
      const now = new Date();
      const day = now.getDay(); // 0=dim, 1=lun, 2=mar
      const hour = now.getHours();

      // Show on Monday OR Tuesday before 12h
      const isMondayWindow = day === 1 || (day === 2 && hour < 12);

      const weekLabel = getCurrentWeekLabel();
      const alreadySeen = localStorage.getItem(`monday_reveal_seen_${weekLabel}`);
      const hasDeltas = deltas && Object.values(deltas).some((d) => typeof d === "number" && d !== 0);

      if (isMondayWindow && !alreadySeen && hasDeltas) {
        setShowMondayReveal(true);
      }
    } catch {
      // localStorage not available
    }
  }, [deltas]);

  useEffect(() => {
    trackEvent("dashboard_viewed", { tier, ovr: stats.ovr, badge_count: badges.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revealPreviousTier = serverPreviousTier ?? previousTier;

  return (
    <>
      {/* Monday Reveal — pack opening animation */}
      {showMondayReveal && deltas && (
        <MondayReveal
          stats={stats}
          deltas={deltas}
          tier={tier}
          previousTier={revealPreviousTier}
          specialCard={specialCard ?? null}
          streak={streak}
          username={username}
          avatarUrl={avatarUrl}
          userId={userId}
          onComplete={() => {
            const weekLabel = getCurrentWeekLabel();
            try {
              localStorage.setItem(`monday_reveal_seen_${weekLabel}`, "true");
            } catch {}
            setShowMondayReveal(false);
          }}
        />
      )}

      <LevelUpToast previousTier={previousTier} currentTier={tier} />
      <BadgeToast userId={userId} />

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

      {/* Tier progress bar */}
      <TierProgress ovr={stats.ovr} tier={tier} />

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
      <div className="flex gap-3">
        <DownloadButton tier={tier} userId={userId} />
        <ShareButton tier={tier} userId={userId} />
      </div>

      {/* Dashboard feed — weekly stats, Échappée teaser, quick links */}
      <DashboardFeed userId={userId} tier={tier} />

      <RouteAnalysisSection tier={tier} />
    </>
  );
}
