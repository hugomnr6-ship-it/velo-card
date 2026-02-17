"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import { useUserBadges, useShowcaseBadges } from "@/hooks/useBadges";
import { allBadgeDefinitions, type AchievementBadge } from "@/lib/badges";
import { useToast } from "@/contexts/ToastContext";

const rarityColors: Record<string, string> = {
  common: "#94A3B8",
  rare: "#6366F1",
  epic: "#A78BFA",
  legendary: "#FFD700",
};

const rarityLabels: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Epique",
  legendary: "Legendaire",
};

const categoryLabels: Record<string, string> = {
  progression: "Progression",
  social: "Social",
  performance: "Performance",
  race: "Course",
};

type FilterCategory = "all" | "progression" | "social" | "performance" | "race";

export default function BadgesPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data: userBadges, isLoading } = useUserBadges();
  const showcaseMutation = useShowcaseBadges();
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [selected, setSelected] = useState<AchievementBadge | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const earnedSet = new Set((userBadges || []).map((b) => b.badge_id));
  const earnedCount = (userBadges || []).length;
  const totalCount = allBadgeDefinitions.length;

  const filtered = filter === "all"
    ? allBadgeDefinitions
    : allBadgeDefinitions.filter((b) => b.category === filter);

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#127895;</span>}
          title="Badges"
          subtitle={`${earnedCount}/${totalCount} debloques`}
        />

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <m.div
              className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA]"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto">
          {(["all", "progression", "social", "performance", "race"] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === cat
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/5 text-white/50"
              }`}
            >
              {cat === "all" ? "Tous" : categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {filtered.map((badge) => {
            const isEarned = earnedSet.has(badge.id);
            const color = rarityColors[badge.rarity];

            return (
              <m.button
                key={badge.id}
                onClick={() => setSelected(badge)}
                whileTap={{ scale: 0.92 }}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition ${
                  isEarned
                    ? "border-white/[0.08] bg-[#1A1A2E]/80"
                    : "border-white/[0.04] bg-[#1A1A2E]/30 opacity-35"
                }`}
                style={isEarned ? { boxShadow: `0 0 12px ${color}15` } : undefined}
              >
                <span className={`text-2xl ${!isEarned ? "grayscale" : ""}`}>
                  {badge.icon}
                </span>
                <p className="mt-1 text-[9px] font-bold text-white/60 text-center leading-tight line-clamp-2">
                  {badge.name}
                </p>
                <div
                  className="mt-0.5 h-0.5 w-4 rounded-full"
                  style={{ background: isEarned ? color : "rgba(255,255,255,0.06)" }}
                />
              </m.button>
            );
          })}
        </div>

        {/* Badge detail modal */}
        <AnimatePresence>
          {selected && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="mx-4 w-full max-w-xs rounded-2xl border border-white/[0.08] bg-[#111827] p-6"
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-5xl">{selected.icon}</span>
                  <h3 className="mt-3 text-lg font-bold text-white">{selected.name}</h3>
                  <p className="mt-1 text-sm text-[#94A3B8]">{selected.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: rarityColors[selected.rarity],
                        background: `${rarityColors[selected.rarity]}15`,
                        border: `1px solid ${rarityColors[selected.rarity]}30`,
                      }}
                    >
                      {rarityLabels[selected.rarity]}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B]">
                      {categoryLabels[selected.category]}
                    </span>
                  </div>
                  {earnedSet.has(selected.id) ? (
                    <div className="mt-4 rounded-lg bg-[#00F5D4]/10 px-4 py-2 text-sm font-bold text-[#00F5D4]">
                      Debloque &#10003;
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg bg-white/[0.04] px-4 py-2 text-sm text-[#64748B]">
                      Non debloque
                    </div>
                  )}
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}
