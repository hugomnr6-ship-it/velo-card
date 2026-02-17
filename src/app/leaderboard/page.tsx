"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import RegionSelector from "@/components/RegionSelector";
import SortTabs from "@/components/SortTabs";
import Podium from "@/components/Podium";
import LeaderboardRow from "@/components/LeaderboardRow";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { LeaderboardSkeleton } from "@/components/Skeleton";
import Skeleton from "@/components/Skeleton";
import { TrophyIcon } from "@/components/icons/TabIcons";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useProfile } from "@/hooks/useProfile";
import type { FrenchRegion, LeaderboardEntry, LeaderboardSort, CardTier } from "@/types";

// ——— Race Points Leaderboard types ———
interface RacePointsEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  ovr: number;
  tier: CardTier;
  total_points: number;
  victories: number;
  podiums: number;
  races: number;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

type LeaderboardMode = "weekly" | "race_points";
type LeaderboardScope = "region" | "france";

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<LeaderboardMode>("weekly");
  const [scope, setScope] = useState<LeaderboardScope>("region");
  const [region, setRegion] = useState<FrenchRegion | null>(null);
  const [userRegion, setUserRegion] = useState<FrenchRegion | null>(null);
  const [sort, setSort] = useState<LeaderboardSort>("weekly_km");
  // racePointsEntries + loading handled by React Query below

  // Fetch profile for region
  const { data: profileData, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Set region from profile once loaded
  useEffect(() => {
    if (profileData?.region && !region) {
      setRegion(profileData.region);
      setUserRegion(profileData.region);
    }
  }, [profileData, region]);

  // Memoize effective region
  const effectiveRegion = useMemo(() => {
    return scope === "france" ? "france" : region;
  }, [scope, region]);

  // Weekly leaderboard via hook
  const { data: entries = [], isLoading: weeklyLoading } = useLeaderboard(
    mode === "weekly" ? effectiveRegion : null,
    sort
  );

  // Race points leaderboard via React Query
  const { data: racePointsEntries = [], isLoading: racePointsLoading } = useQuery<RacePointsEntry[]>({
    queryKey: ["race-points", effectiveRegion, scope],
    queryFn: async () => {
      const params = new URLSearchParams({ leaderboard: "true" });
      if (scope === "region" && region) params.set("region", region);
      const res = await fetch(`/api/race-points?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: mode === "race_points",
  });

  const loading = mode === "weekly" ? weeklyLoading : racePointsLoading;

  async function handleRegionChange(newRegion: FrenchRegion) {
    setRegion(newRegion);
    setUserRegion(newRegion);
    fetch("/api/profile/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: newRegion }),
    });
  }

  function handleScopeChange(newScope: LeaderboardScope) {
    setScope(newScope);
    if (newScope === "region" && userRegion) {
      setRegion(userRegion);
    }
  }

  if (status === "loading" || !session || profileLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <LeaderboardSkeleton />
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader icon={<TrophyIcon size={28} />} title="Classement" />

        {/* Mode Toggle */}
        <div className="mb-4 flex gap-1 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-1">
          <button
            onClick={() => setMode("weekly")}
            className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "weekly" ? "text-black" : "text-[#94A3B8]"
            }`}
          >
            {mode === "weekly" && (
              <m.div
                layoutId="mode-tab"
                className="absolute inset-0 rounded-lg bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">Hebdomadaire</span>
          </button>
          <button
            onClick={() => setMode("race_points")}
            className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "race_points" ? "text-white" : "text-[#94A3B8]"
            }`}
          >
            {mode === "race_points" && (
              <m.div
                layoutId="mode-tab"
                className="absolute inset-0 rounded-lg bg-[#6366F1]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">Points Course</span>
          </button>
        </div>

        {/* Scope toggle: Ma région / France */}
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => handleScopeChange("region")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              scope === "region"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/50 hover:text-white/70"
            }`}
          >
            Ma region
          </button>
          <button
            onClick={() => handleScopeChange("france")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              scope === "france"
                ? "bg-[#6366F1] text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "border border-white/10 bg-white/5 text-white/50 hover:text-white/70"
            }`}
          >
            France
          </button>
        </div>

        {/* Region selector (only when scope is region) */}
        {scope === "region" && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">
              Region
            </p>
            <RegionSelector value={region} onChange={handleRegionChange} />
          </div>
        )}

        {!effectiveRegion && mode === "weekly" ? (
          <EmptyState
            icon={<TrophyIcon size={48} />}
            title="Choisis ta region"
            description="Selectionne ta region pour voir le classement."
          />
        ) : mode === "weekly" ? (
          /* ═══ Weekly Leaderboard ═══ */
          <>
            <div className="mb-4">
              <SortTabs active={sort} onChange={setSort} />
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={<TrophyIcon size={48} />}
                title="Aucun cycliste"
                description="Aucun cycliste dans cette region cette semaine."
              />
            ) : (
              <>
                {entries.length >= 3 && <Podium entries={entries} />}
                <AnimatedList className="flex flex-col gap-2">
                  {entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => (
                    <AnimatedListItem key={entry.user_id}>
                      <LeaderboardRow
                        entry={entry}
                        isCurrentUser={entry.user_id === session.user.id}
                      />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </>
            )}
          </>
        ) : (
          /* ═══ Race Points Leaderboard ═══ */
          <>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : racePointsEntries.length === 0 ? (
              <EmptyState
                icon={<TrophyIcon size={48} />}
                title="Aucun resultat"
                description="Participe a des courses pour gagner des points !"
              />
            ) : (
              <AnimatedList className="flex flex-col gap-2">
                {racePointsEntries.map((entry) => (
                  <AnimatedListItem key={entry.user_id}>
                    <m.div
                      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                        entry.user_id === session.user.id
                          ? "border-[#6366F1]/30 bg-[#6366F1]/5"
                          : "border-white/[0.06] bg-[#1A1A2E]/60"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Rank */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                        {entry.rank <= 3 ? (
                          <span className="text-sm">
                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#64748B]">{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="h-9 w-9 rounded-full border" style={{ borderColor: tierAccentHex[entry.tier] }} />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#22223A] border" style={{ borderColor: tierAccentHex[entry.tier] }} />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-white">{entry.username}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                          <span>{entry.races} courses</span>
                          {entry.victories > 0 && (
                            <span className="text-[#FFD700]">{entry.victories} victoire{entry.victories > 1 ? "s" : ""}</span>
                          )}
                          {entry.podiums > entry.victories && (
                            <span className="text-[#94A3B8]">{entry.podiums} podium{entry.podiums > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-lg font-black text-[#6366F1]">{entry.total_points}</span>
                        <span className="text-[9px] font-bold text-[#475569]">PTS</span>
                      </div>
                    </m.div>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
