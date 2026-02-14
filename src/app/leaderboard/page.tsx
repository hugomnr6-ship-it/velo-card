"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import type { FrenchRegion, LeaderboardEntry, LeaderboardSort } from "@/types";

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [region, setRegion] = useState<FrenchRegion | null>(null);
  const [sort, setSort] = useState<LeaderboardSort>("weekly_km");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [regionLoading, setRegionLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.region) setRegion(data.region);
        })
        .finally(() => setRegionLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (region) fetchLeaderboard();
  }, [region, sort]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?region=${encodeURIComponent(region!)}&sort=${sort}`
      );
      if (res.ok) {
        setEntries(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegionChange(newRegion: FrenchRegion) {
    setRegion(newRegion);
    fetch("/api/profile/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: newRegion }),
    });
  }

  if (status === "loading" || !session || regionLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <LeaderboardSkeleton />
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader icon={<TrophyIcon size={28} />} title="Classement hebdomadaire" />

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Region
          </p>
          <RegionSelector value={region} onChange={handleRegionChange} />
        </div>

        {!region ? (
          <EmptyState
            icon={<TrophyIcon size={48} />}
            title="Choisis ta region"
            description="Selectionne ta region pour voir le classement."
          />
        ) : (
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
                {/* Podium top 3 */}
                {entries.length >= 3 && <Podium entries={entries} />}

                {/* Remaining entries */}
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
        )}
      </div>
    </AnimatedPage>
  );
}
