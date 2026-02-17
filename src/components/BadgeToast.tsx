"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { badgeMap } from "@/lib/badges";

interface BadgeToastProps {
  userId: string;
}

interface RecentBadge {
  badge_id: string;
  earned_at: string;
}

/**
 * Checks for badges earned in the last 60 seconds and shows a toast for each.
 * Self-contained — just mount it and it handles everything.
 */
export default function BadgeToast({ userId }: BadgeToastProps) {
  const [newBadges, setNewBadges] = useState<RecentBadge[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const lastCheck = sessionStorage.getItem("velocard-badge-check");
    const now = Date.now();

    // Only check once per session load (not every render)
    if (lastCheck && now - parseInt(lastCheck) < 30_000) return;
    sessionStorage.setItem("velocard-badge-check", now.toString());

    fetch(`/api/badges?userId=${userId}`)
      .then((r) => r.json())
      .then((badges: RecentBadge[]) => {
        if (!Array.isArray(badges)) return;
        // Filter badges earned in the last 60 seconds
        const recent = badges.filter((b) => {
          const earned = new Date(b.earned_at).getTime();
          return now - earned < 60_000;
        });
        if (recent.length > 0) setNewBadges(recent);
      })
      .catch(() => {});
  }, [userId]);

  // Auto-advance through badges
  useEffect(() => {
    if (newBadges.length === 0) return;
    if (visibleIndex >= newBadges.length) return;

    const timer = setTimeout(() => {
      setVisibleIndex((i) => i + 1);
    }, 3500);
    return () => clearTimeout(timer);
  }, [visibleIndex, newBadges]);

  if (newBadges.length === 0 || visibleIndex >= newBadges.length) return null;

  const current = newBadges[visibleIndex];
  const badgeDef = badgeMap.get(current.badge_id);
  if (!badgeDef) return null;

  const rarityColor: Record<string, string> = {
    common: "#94A3B8",
    rare: "#6366F1",
    epic: "#A78BFA",
    legendary: "#FFD700",
  };

  return (
    <AnimatePresence>
      <m.div
        key={current.badge_id}
        role="status"
        aria-live="polite"
        aria-label={`Nouveau badge débloqué : ${badgeDef.name}`}
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed left-1/2 top-4 z-[200] -translate-x-1/2"
      >
        <div
          className="flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl"
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            borderColor: `${rarityColor[badgeDef.rarity]}40`,
            boxShadow: `0 0 30px ${rarityColor[badgeDef.rarity]}15`,
          }}
        >
          <span className="text-2xl">{badgeDef.icon}</span>
          <div>
            <p className="text-[10px] font-bold tracking-wider" style={{ color: rarityColor[badgeDef.rarity] }}>
              NOUVEAU BADGE
            </p>
            <p className="text-sm font-bold text-white">{badgeDef.name}</p>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
