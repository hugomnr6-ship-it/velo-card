"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import Skeleton from "@/components/Skeleton";
import { useSeason, useMySeasonStats } from "@/hooks/useSeason";

const tierAccentHex: Record<string, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

export default function SeasonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: seasonData, isLoading: seasonLoading } = useSeason();
  const { data: myStats, isLoading: statsLoading } = useMySeasonStats();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const loading = status === "loading" || seasonLoading || statsLoading;

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <Skeleton className="mb-4 h-32 w-full rounded-xl" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (!seasonData?.season) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <PageHeader icon={<span className="text-2xl">&#127942;</span>} title="Saison" />
          <EmptyState
            icon={<span className="text-4xl">&#127942;</span>}
            title="Aucune saison active"
            description="La prochaine saison arrive bientot !"
          />
        </div>
      </AnimatedPage>
    );
  }

  const season = seasonData.season;
  const rankings = seasonData.rankings || [];
  const daysLeft = Math.max(0, Math.ceil((new Date(season.end_date).getTime() - Date.now()) / 86400000));

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader icon={<span className="text-2xl">&#127942;</span>} title="Saison" />

        {/* Season banner */}
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 overflow-hidden rounded-xl border border-[#6366F1]/20 bg-gradient-to-br from-[#6366F1]/10 to-[#1A1A2E]/60"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">{season.name}</p>
                <p className="text-xs text-[#94A3B8]">
                  {new Date(season.start_date).toLocaleDateString("fr")} — {new Date(season.end_date).toLocaleDateString("fr")}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-[#6366F1]">{daysLeft}</span>
                <span className="text-[9px] font-bold text-[#475569]">JOURS</span>
              </div>
            </div>
          </div>
        </m.div>

        {/* My stats card */}
        {myStats && (
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
                Mes stats
              </p>
              {myStats.rank && (
                <span className="rounded-full bg-[#6366F1]/20 px-2.5 py-0.5 text-xs font-bold text-[#6366F1]">
                  #{myStats.rank} / {myStats.total_participants}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-[#6366F1]">{myStats.season_points}</span>
              <span className="text-xs font-bold text-[#475569]">PTS</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "KM", value: Math.round(myStats.total_km) },
                { label: "D+", value: Math.round(myStats.total_dplus) },
                { label: "Duels", value: myStats.duels_won },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                  <p className="text-sm font-bold text-white">{s.value}</p>
                  <p className="text-[9px] font-bold text-[#64748B]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rankings */}
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
          Classement saison
        </p>
        {rankings.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-4 text-center text-sm text-[#94A3B8]">
            Aucun participant pour le moment
          </div>
        ) : (
          <AnimatedList className="flex flex-col gap-2">
            {rankings.map((entry: any, i: number) => {
              const isMe = entry.user_id === session?.user?.id;
              return (
                <AnimatedListItem key={entry.user_id}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      isMe
                        ? "border-[#6366F1]/30 bg-[#6366F1]/5"
                        : "border-white/[0.06] bg-[#1A1A2E]/60"
                    }`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      {i < 3 ? (
                        <span className="text-sm">
                          {i === 0 ? "\uD83E\uDD47" : i === 1 ? "\uD83E\uDD48" : "\uD83E\uDD49"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#64748B]">{entry.rank || i + 1}</span>
                      )}
                    </div>
                    {entry.profiles?.avatar_url ? (
                      <img
                        src={`/api/img?url=${encodeURIComponent(entry.profiles.avatar_url)}`}
                        alt=""
                        className="h-9 w-9 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22223A]">
                        <span className="text-xs font-bold text-white/50">
                          {(entry.profiles?.username || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {entry.profiles?.username || "Cycliste"}
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        {Math.round(entry.total_km)} km
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-lg font-black text-[#6366F1]">
                        {entry.season_points}
                      </span>
                      <span className="text-[9px] font-bold text-[#475569]">PTS</span>
                    </div>
                  </div>
                </AnimatedListItem>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}
