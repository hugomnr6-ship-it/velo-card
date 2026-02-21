"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { useCoins } from "@/hooks/useCoins";
import { useQuests, type UserQuest } from "@/hooks/useQuests";
import { useMySeasonStats } from "@/hooks/useSeason";

export default function GamificationWidgets() {
  const { data: coins } = useCoins();
  const { data: quests } = useQuests();
  const { data: seasonStats } = useMySeasonStats();

  const activeQuests = (quests || []).filter((q) => !q.is_completed);
  const completedToday = (quests || []).filter((q) => q.is_completed).length;
  const totalQuests = (quests || []).length;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {/* VeloCoins + Quick links row */}
      <div className="flex gap-2">
        {/* Coins balance */}
        <Link
          href="/shop"
          className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#FFD700]/15 bg-[#FFD700]/5 p-3 transition hover:bg-[#FFD700]/8"
        >
          <span className="text-xl">&#128176;</span>
          <div>
            <p className="text-lg font-black text-[#FFD700]">
              {coins?.balance ?? "..."}
            </p>
            <p className="text-[9px] font-bold text-[#FFD700]/50">VELOCOINS</p>
          </div>
        </Link>

        {/* Season rank */}
        {seasonStats && seasonStats.rank && (
          <Link
            href="/season"
            className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#6366F1]/15 bg-[#6366F1]/5 p-3 transition hover:bg-[#6366F1]/8"
          >
            <span className="text-xl">&#127942;</span>
            <div>
              <p className="text-lg font-black text-[#6366F1]">
                #{seasonStats.rank}
              </p>
              <p className="text-[9px] font-bold text-[#6366F1]/50">
                {seasonStats.season_points} PTS
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Quick quests preview */}
      {totalQuests > 0 && (
        <Link
          href="/quests"
          className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3 transition hover:bg-[#1A1A2E]/80"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>&#127919;</span>
              <span className="text-xs font-bold text-white">Quêtes du jour</span>
            </div>
            <span className="text-[10px] font-bold text-[#00F5D4]">
              {completedToday}/{totalQuests}
            </span>
          </div>

          {/* Mini progress bars for active quests (max 3) */}
          <div className="flex flex-col gap-1.5">
            {activeQuests.slice(0, 3).map((q) => (
              <QuestMiniBar key={q.id} quest={q} />
            ))}
            {activeQuests.length === 0 && (
              <p className="text-[10px] text-[#00F5D4]/70">
                Toutes les quêtes sont complétées !
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Quick nav row */}
      <div className="flex gap-2">
        {[
          { href: "/shop", icon: "\uD83D\uDED2", label: "Boutique" },
          { href: "/badges", icon: "\uD83C\uDFC5", label: "Badges" },
          { href: "/quests", icon: "\uD83C\uDF1F", label: "Quêtes" },
          { href: "/inventory", icon: "\uD83C\uDF92", label: "Inventaire" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 py-2.5 transition hover:bg-[#1A1A2E]/80"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[9px] font-bold text-[#64748B]">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuestMiniBar({ quest }: { quest: UserQuest }) {
  const def = quest.quest_definitions;
  const progress = Math.min(quest.current_value / def.target_value, 1);

  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0 text-xs">{def.icon}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <m.div
          className="h-full rounded-full bg-[#00F5D4]"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="flex-shrink-0 text-[9px] font-bold text-[#64748B]">
        {Math.round(quest.current_value)}/{def.target_value}
      </span>
    </div>
  );
}
