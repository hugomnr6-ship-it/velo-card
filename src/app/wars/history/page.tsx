"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WarHistoryEntry } from "@/types";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { SwordsIcon } from "@/components/icons/TabIcons";
import { IconTrophy, IconShield, IconMuscle, IconTimer } from "@/components/icons/VeloIcons";
import Skeleton from "@/components/Skeleton";
import { useWarHistory } from "@/hooks/useWars";

export default function WarHistoryPage() {
  const { status } = useSession();

  // Fetch war history via React Query hook
  const { data: historyData, isLoading: loading } = useWarHistory();
  const history: WarHistoryEntry[] = historyData?.history ?? [];

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
        <Skeleton className="mb-4 h-8 w-56" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full max-w-lg rounded-xl" />
        ))}
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
      <PageHeader icon={<SwordsIcon size={28} />} title="Historique des guerres" />

      <Link
        href="/wars"
        className="text-xs text-[#94A3B8] underline underline-offset-2 hover:text-white/80"
      >
        &larr; Retour a la guerre en cours
      </Link>

      {history.length === 0 ? (
        <EmptyState
          icon={<IconTimer size={36} className="text-white/30" />}
          title="Aucun historique"
          description="Aucune guerre terminee pour le moment."
        />
      ) : (
        <AnimatedList className="flex w-full max-w-lg flex-col gap-2">
          {history.map((entry) => {
            const weekNum = entry.week_label.split("-W")[1] || entry.week_label;
            return (
              <AnimatedListItem key={entry.war_id}>
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    entry.result === "win"
                      ? "border-[#00F5D4]/20 bg-[#00F5D4]/5"
                      : entry.result === "loss"
                        ? "border-red-800/30 bg-red-950/10"
                        : "border-white/[0.06] bg-[#111827]/40"
                  }`}
                >
                  <div className="text-xl">
                    {entry.result === "win"
                      ? <IconTrophy size={20} className="text-[#FFD700]" />
                      : entry.result === "loss"
                        ? <IconMuscle size={20} className="text-red-400" />
                        : "-"}
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-[#1A1A2E]">
                    {entry.opponent_logo_url ? (
                      <img
                        src={`/api/img?url=${encodeURIComponent(entry.opponent_logo_url)}`}
                        alt={entry.opponent_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <IconShield size={18} className="text-white/40" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">
                      vs {entry.opponent_name}
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      Semaine {weekNum}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-family-data)]">
                    <span
                      className={`text-lg font-black ${
                        entry.result === "win" ? "text-[#00F5D4]" : "text-white"
                      }`}
                    >
                      {entry.my_score}
                    </span>
                    <span className="text-xs text-[#475569]">-</span>
                    <span
                      className={`text-lg font-black ${
                        entry.result === "loss" ? "text-red-400" : "text-white"
                      }`}
                    >
                      {entry.opp_score}
                    </span>
                  </div>
                </div>
              </AnimatedListItem>
            );
          })}
        </AnimatedList>
      )}
    </AnimatedPage>
  );
}
