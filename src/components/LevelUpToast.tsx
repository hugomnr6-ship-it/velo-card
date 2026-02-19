"use client";

import { useEffect, useState } from "react";
import type { CardTier } from "@/types";
import { TIER_ICONS } from "@/components/icons/VeloIcons";

interface LevelUpToastProps {
  previousTier: CardTier | null;
  currentTier: CardTier;
}

const tierLabels: Record<CardTier, string> = {
  bronze: "BRONZE",
  argent: "ARGENT",
  platine: "PLATINE",
  diamant: "DIAMANT",
  legende: "LEGENDE",
};

const tierAccents: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C8D4",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

export default function LevelUpToast({ previousTier, currentTier }: LevelUpToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show if tier actually changed (and previousTier is known)
    if (!previousTier || previousTier === currentTier) return;

    // Check tier order to only show on UPGRADE (not downgrade)
    const tierOrder: CardTier[] = ["bronze", "argent", "platine", "diamant", "legende"];
    const prevIdx = tierOrder.indexOf(previousTier);
    const currIdx = tierOrder.indexOf(currentTier);
    if (currIdx <= prevIdx) return;

    setVisible(true);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [previousTier, currentTier]);

  if (!visible || !previousTier) return null;

  const accent = tierAccents[currentTier];

  return (
    <div
      className={`fixed top-6 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-500 ${
        exiting ? "translate-y-[-100px] opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        animation: exiting ? undefined : "slideDown 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(10,10,18,0.9)",
          borderColor: `${accent}40`,
          boxShadow: `0 0 40px ${accent}30, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Glow bar at top */}
        <div
          className="absolute left-0 right-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        <div className="flex items-center gap-4">
          {/* Emoji */}
          <span className="flex items-center">{(() => { const TIcon = TIER_ICONS[currentTier]; return TIcon ? <TIcon size={28} style={{ color: accent }} /> : null; })()}</span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Level Up !
            </p>
            <p className="mt-0.5 text-base font-bold text-white font-['Space_Grotesk']">
              <span className="text-white/40">{tierLabels[previousTier]}</span>
              <span className="mx-2 text-white/30">{"\u2192"}</span>
              <span style={{ color: accent }}>{tierLabels[currentTier]}</span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
