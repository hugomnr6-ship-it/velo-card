"use client";

import type { LeaderboardSort } from "@/types";

interface SortTabsProps {
  active: LeaderboardSort;
  onChange: (sort: LeaderboardSort) => void;
}

const tabs: { key: LeaderboardSort; label: string }[] = [
  { key: "weekly_km", label: "Km semaine" },
  { key: "weekly_dplus", label: "D+ semaine" },
  { key: "card_score", label: "Score carte" },
];

export default function SortTabs({ active, onChange }: SortTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-neutral-700/50 bg-neutral-800/50 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            active === t.key
              ? "bg-white text-black"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
