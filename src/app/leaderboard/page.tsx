"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RegionSelector from "@/components/RegionSelector";
import SortTabs from "@/components/SortTabs";
import LeaderboardRow from "@/components/LeaderboardRow";
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

  // Fetch user's saved region on mount
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

  // Fetch leaderboard when region or sort changes
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
    // Also persist in DB
    fetch("/api/profile/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: newRegion }),
    });
  }

  if (status === "loading" || !session || regionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">
          🏆 Classement hebdomadaire
        </h1>

        {/* Region selector */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Région
          </p>
          <RegionSelector value={region} onChange={handleRegionChange} />
        </div>

        {!region ? (
          <div className="mt-8 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-8 text-center">
            <p className="text-neutral-400">
              Choisis ta région pour voir le classement.
            </p>
          </div>
        ) : (
          <>
            {/* Sort tabs */}
            <div className="mb-4">
              <SortTabs active={sort} onChange={setSort} />
            </div>

            {/* Leaderboard */}
            {loading ? (
              <p className="mt-8 text-center text-sm text-neutral-400">
                Chargement du classement...
              </p>
            ) : entries.length === 0 ? (
              <div className="mt-8 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-8 text-center">
                <p className="text-neutral-400">
                  Aucun cycliste dans cette région cette semaine.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === session.user.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
