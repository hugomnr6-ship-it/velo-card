"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import { useFantasyLeague } from "@/hooks/useFantasy";

export default function FantasyScoresPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { data, isLoading } = useFantasyLeague(leagueId);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (data?.league?.current_week) {
      setSelectedWeek(data.league.current_week);
    }
  }, [data?.league?.current_week]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <Skeleton className="mb-4 h-16 w-full rounded-xl" />
          <Skeleton className="mb-2 h-40 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { league, participants, weeklyScores } = data;
  const totalWeeks = league.current_week || 0;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // Scores for selected week
  const weekScores = weeklyScores
    .filter((s) => s.week_number === selectedWeek)
    .sort((a, b) => b.total_score - a.total_score);

  // Get participant info by id
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push(`/fantasy/${leagueId}`)}
          className="mb-3 text-xs font-bold text-[#94A3B8] hover:text-white"
        >
          &larr; Retour à la ligue
        </button>

        <PageHeader
          icon={<span className="text-2xl">&#128200;</span>}
          title="Scores"
          subtitle={league.name}
        />

        {/* Week selector */}
        {weeks.length > 0 && (
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {weeks.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  selectedWeek === w
                    ? "border-[#6366F1]/50 bg-[#6366F1]/10 text-[#6366F1]"
                    : "border-white/[0.06] text-[#64748B] hover:text-white"
                }`}
              >
                S{w}
              </button>
            ))}
          </div>
        )}

        {/* General ranking */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#FFD700]">
            Classement général
          </p>
          <div className="flex flex-col gap-2">
            {participants
              .sort((a, b) => b.total_points - a.total_points)
              .map((p, idx) => (
                <m.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    idx === 0
                      ? "border-[#FFD700]/20 bg-[#FFD700]/5"
                      : "border-white/[0.06] bg-[#1A1A2E]/60"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                    idx === 0 ? "bg-[#FFD700]/20 text-[#FFD700]" :
                    idx === 1 ? "bg-[#C0C0C0]/20 text-[#C0C0C0]" :
                    idx === 2 ? "bg-[#CD7F32]/20 text-[#CD7F32]" :
                    "bg-white/5 text-[#64748B]"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {p.user?.username || "Cycliste"}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Cette semaine: {p.weekly_points} pts
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#00F5D4]">
                    {p.total_points}
                  </span>
                </m.div>
              ))}
          </div>
        </div>

        {/* Weekly breakdown */}
        {selectedWeek && weekScores.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#A78BFA]">
              Détails semaine {selectedWeek}
            </p>
            <div className="flex flex-col gap-3">
              {weekScores.map((score) => {
                const participant = participantMap.get(score.participant_id);
                const breakdown = score.breakdown as Record<string, any> || {};

                return (
                  <m.div
                    key={score.participant_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">
                        {participant?.user?.username || "Cycliste"}
                      </p>
                      <span className="text-lg font-black text-[#00F5D4]">
                        {score.total_score}
                      </span>
                    </div>

                    {/* Cyclist breakdown */}
                    <div className="mt-3 flex flex-col gap-2">
                      {Object.entries(breakdown).map(([cyclistId, info]: [string, any]) => (
                        <div
                          key={cyclistId}
                          className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] font-bold text-white/80">
                                {info.name || "Cycliste"}
                              </span>
                              {info.captain_bonus && (
                                <span className="text-[9px] text-[#FFD700]">&#9733;×2</span>
                              )}
                              {info.super_sub_used && (
                                <span className="text-[9px] text-[#FF6B35]">SUB&#10003;</span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-1.5 text-[9px] text-[#64748B]">
                              {info.details?.km > 0 && <span>{info.details.km}km</span>}
                              {info.details?.elevation > 0 && <span>{info.details.elevation}m D+</span>}
                              {info.details?.ovr_change !== 0 && (
                                <span className={info.details.ovr_change > 0 ? "text-[#00F5D4]" : "text-red-400"}>
                                  OVR {info.details.ovr_change > 0 ? "+" : ""}{info.details.ovr_change}
                                </span>
                              )}
                              {info.details?.tier_up && <span className="text-[#FFD700]">Tier&#8593;</span>}
                              {info.details?.duels_won > 0 && <span>{info.details.duels_won} duels</span>}
                              {info.details?.totw && <span className="text-[#FFD700]">&#9733;TOTW</span>}
                            </div>
                          </div>
                          <span className="text-xs font-black text-white/60">
                            {info.captain_bonus ? info.base_points * 2 : info.base_points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        )}

        {weeks.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/40 p-6 text-center">
            <p className="text-sm text-[#64748B]">
              Les scores apparaîtront après la première semaine.
            </p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
