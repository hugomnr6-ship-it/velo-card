"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import VeloCardInteractive from "@/components/VeloCardInteractive";
import CardWidget from "@/components/CardWidget";
import DownloadButton from "@/components/DownloadButton";
import ShareButton from "@/components/ShareButton";
import LevelUpToast from "@/components/LevelUpToast";
import MondayUpdateBanner from "@/components/MondayUpdateBanner";
import TierProgress from "@/components/TierProgress";
import BadgeToast from "@/components/BadgeToast";
import DashboardFeed from "./DashboardFeed";
import FeatureTooltip from "@/components/FeatureTooltip";
import { trackEvent } from "@/lib/analytics";

const MondayReveal = dynamic(() => import("@/components/MondayReveal"), { ssr: false });
const GamificationWidgets = dynamic(() => import("./GamificationWidgets"), { ssr: false });
const WeekendRacesWidget = dynamic(() => import("./WeekendRacesWidget"), { ssr: false });
const RouteAnalysisSection = dynamic(() => import("./RouteAnalysisSection"), { ssr: false });
import Link from "next/link";
import type { ComputedStats, CardTier, Badge, ClubInfo, StatDeltas, SpecialCardType } from "@/types";
import type { CardSkinId } from "@/components/VeloCard";

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
  country?: string;
  countryCode?: string;
  userId: string;
  deltas?: StatDeltas | null;
  specialCard?: SpecialCardType | null;
  streak?: number;
  serverPreviousTier?: CardTier | null;
  skin?: CardSkinId;
  betaNumber?: number | null;
  isPro?: boolean;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  country,
  countryCode,
  userId,
  deltas,
  specialCard,
  streak = 0,
  serverPreviousTier,
  skin,
  betaNumber,
  isPro = false,
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

      {/* Bandeau mise à jour stats — free users uniquement */}
      {!isPro && (
        <div className="flex w-full max-w-sm flex-col gap-1 rounded-lg border border-[#6366F1]/10 bg-[#6366F1]/[0.04] px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#94A3B8]">
              Prochaine mise à jour lundi
            </p>
            <Link
              href="/pricing"
              className="text-[11px] font-semibold text-[#6366F1] transition hover:text-[#6366F1]/80"
            >
              Temps réel avec Pro →
            </Link>
          </div>
          <p className="text-[10px] text-white/20">
            Dernière MAJ : {(() => {
              const now = new Date();
              const day = now.getDay();
              const diff = day === 0 ? 6 : day - 1;
              const lastMonday = new Date(now);
              lastMonday.setDate(now.getDate() - diff);
              return lastMonday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            })()}
          </p>
        </div>
      )}

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
        country={country}
        countryCode={countryCode}
        specialCard={specialCard}
        betaNumber={betaNumber}
        skin={skin}
      />
      <div className="mt-6 flex items-center justify-center gap-3">
        <DownloadButton tier={tier} userId={userId} isPro={isPro} />
        <FeatureTooltip id="card-share" title="Partage ta carte !" description="Exporte ta VeloCard en story Instagram ou QR code." position="top">
          <ShareButton tier={tier} userId={userId} isPro={isPro} />
        </FeatureTooltip>
      </div>

      {/* Gamification widgets — coins, quests, season, quick links */}
      <GamificationWidgets />

      {/* Widget courses à venir cette semaine */}
      <WeekendRacesWidget />

      {/* Dashboard feed — weekly stats, Échappée teaser, quick links */}
      <DashboardFeed userId={userId} tier={tier} />

      <RouteAnalysisSection tier={tier} />
    </>
  );
}
