"use client";

import { useState } from "react";
import { m } from "framer-motion";
import type { LeaderboardSort } from "@/types";

interface SortTabsProps {
  active: LeaderboardSort;
  onChange: (sort: LeaderboardSort) => void;
}

const mainTabs: { key: LeaderboardSort; label: string }[] = [
  { key: "weekly_km", label: "Km" },
  { key: "weekly_dplus", label: "D+" },
  { key: "ovr", label: "OVR" },
  { key: "card_score", label: "Score" },
];

const attrTabs: { key: LeaderboardSort; label: string }[] = [
  { key: "pac", label: "VIT" },
  { key: "mon", label: "MON" },
  { key: "val", label: "TEC" },
  { key: "spr", label: "SPR" },
  { key: "end", label: "END" },
  { key: "res", label: "PUI" },
];

export default function SortTabs({ active, onChange }: SortTabsProps) {
  const [showAttrs, setShowAttrs] = useState(false);
  const isAttr = attrTabs.some((t) => t.key === active);

  return (
    <div className="flex flex-col gap-2">
      {/* Main tabs */}
      <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/60 p-1">
        {mainTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              onChange(t.key);
              setShowAttrs(false);
            }}
            className="relative rounded-md px-3 py-1.5 text-xs font-semibold transition"
          >
            {active === t.key && !isAttr && (
              <m.div
                layoutId="sort-active"
                className="absolute inset-0 rounded-md bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span
              className={`relative z-10 ${
                active === t.key && !isAttr
                  ? "text-black"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {t.label}
            </span>
          </button>
        ))}
        {/* Attribute toggle */}
        <button
          onClick={() => setShowAttrs((s) => !s)}
          className={`relative rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            isAttr || showAttrs
              ? "bg-white/10 text-white"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          Par Attribut
        </button>
      </div>

      {/* Attribute sub-tabs */}
      {(showAttrs || isAttr) && (
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/60 p-1">
          {attrTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="relative flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
            >
              {active === t.key && (
                <m.div
                  layoutId="attr-active"
                  className="absolute inset-0 rounded-md bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  active === t.key
                    ? "text-black"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
