"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { allBadgeDefinitions, type AchievementBadge } from "@/lib/badges";

interface BadgeGridProps {
  userId: string;
}

const rarityColors: Record<string, string> = {
  common: "#94A3B8",
  rare: "#6366F1",
  epic: "#A78BFA",
  legendary: "#FFD700",
};

const rarityBg: Record<string, string> = {
  common: "rgba(148,163,184,0.08)",
  rare: "rgba(99,102,241,0.08)",
  epic: "rgba(167,139,250,0.08)",
  legendary: "rgba(255,215,0,0.08)",
};

export default function BadgeGrid({ userId }: BadgeGridProps) {
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/badges?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEarnedIds(new Set(data.map((b: any) => b.badge_id)));
        }
      })
      .catch(() => {});
  }, [userId]);

  // Group by category
  const categories: { key: string; label: string; badges: AchievementBadge[] }[] = [
    { key: "progression", label: "Progression", badges: allBadgeDefinitions.filter((b) => b.category === "progression") },
    { key: "social", label: "Social", badges: allBadgeDefinitions.filter((b) => b.category === "social") },
    { key: "performance", label: "Performance", badges: allBadgeDefinitions.filter((b) => b.category === "performance") },
    { key: "race", label: "Course", badges: allBadgeDefinitions.filter((b) => b.category === "race") },
  ];

  const totalEarned = allBadgeDefinitions.filter((b) => earnedIds.has(b.id)).length;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold text-white/40">
          {totalEarned}/{allBadgeDefinitions.length} badges
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(totalEarned / allBadgeDefinitions.length) * 100}%`,
              background: "linear-gradient(90deg, #00F5D4, #6366F1)",
            }}
          />
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat.key} className="mb-4">
          <p className="mb-2 text-[10px] font-bold tracking-wider text-white/25">
            {cat.label.toUpperCase()}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {cat.badges.map((badge, i) => {
              const earned = earnedIds.has(badge.id);
              const color = rarityColors[badge.rarity];
              const bg = rarityBg[badge.rarity];

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex flex-col items-center"
                  title={`${badge.name}: ${badge.description}`}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all"
                    style={{
                      background: earned ? bg : "rgba(255,255,255,0.02)",
                      borderColor: earned ? `${color}30` : "rgba(255,255,255,0.04)",
                      opacity: earned ? 1 : 0.35,
                      filter: earned ? "none" : "grayscale(1)",
                    }}
                  >
                    <span className="text-lg">{badge.icon}</span>
                  </div>
                  <p
                    className="mt-1 max-w-[48px] truncate text-center text-[7px] font-semibold"
                    style={{ color: earned ? color : "rgba(255,255,255,0.2)" }}
                  >
                    {badge.name}
                  </p>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1A1A2E] px-2.5 py-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                    <p className="whitespace-nowrap text-[9px] font-semibold text-white">
                      {badge.name}
                    </p>
                    <p className="whitespace-nowrap text-[8px] text-white/50">
                      {badge.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
