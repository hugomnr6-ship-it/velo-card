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
import { useQuests } from "@/hooks/useQuests";
import { useCoins } from "@/hooks/useCoins";

const rarityColors: Record<string, string> = {
  daily: "#00F5D4",
  weekly: "#6366F1",
};

export default function QuestsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: quests, isLoading } = useQuests();
  const { data: coins } = useCoins();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="mb-3 h-20 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  const dailyQuests = (quests || []).filter((q) => q.quest_definitions.quest_type === "daily");
  const weeklyQuests = (quests || []).filter((q) => q.quest_definitions.quest_type === "weekly");

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#127919;</span>}
          title="Quêtes"
          subtitle={coins ? `${coins.balance} VeloCoins` : undefined}
        />

        {/* Daily Quests */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00F5D4]">
            Quêtes du jour
          </p>
          {dailyQuests.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-4 text-center text-sm text-[#94A3B8]">
              Synchronise tes activités pour débloquer les quêtes du jour
            </div>
          ) : (
            <AnimatedList className="flex flex-col gap-2">
              {dailyQuests.map((q) => (
                <AnimatedListItem key={q.id}>
                  <QuestCard quest={q} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </div>

        {/* Weekly Quests */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#6366F1]">
            Quêtes de la semaine
          </p>
          {weeklyQuests.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-4 text-center text-sm text-[#94A3B8]">
              Les quêtes hebdo arrivent chaque lundi
            </div>
          ) : (
            <AnimatedList className="flex flex-col gap-2">
              {weeklyQuests.map((q) => (
                <AnimatedListItem key={q.id}>
                  <QuestCard quest={q} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

function QuestCard({ quest }: { quest: any }) {
  const def = quest.quest_definitions;
  const progress = Math.min(quest.current_value / def.target_value, 1);
  const color = rarityColors[def.quest_type] || "#94A3B8";
  const isComplete = quest.is_completed;

  return (
    <m.div
      className={`rounded-xl border p-3 transition ${
        isComplete
          ? "border-[#00F5D4]/20 bg-[#00F5D4]/5"
          : "border-white/[0.06] bg-[#1A1A2E]/60"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg">
          {def.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">{def.title}</p>
            <div className="flex items-center gap-1 text-xs font-bold" style={{ color }}>
              <span>&#128176;</span>
              <span>{def.coin_reward}</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-[#94A3B8]">{def.description}</p>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <m.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="flex-shrink-0 text-[10px] font-bold text-[#64748B]">
              {isComplete ? (
                <span style={{ color: "#00F5D4" }}>&#10003;</span>
              ) : (
                `${Math.round(quest.current_value)}/${def.target_value}`
              )}
            </span>
          </div>
        </div>
      </div>
    </m.div>
  );
}
