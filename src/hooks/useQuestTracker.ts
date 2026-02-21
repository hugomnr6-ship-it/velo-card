import { useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

type QuestMetric =
  | "leaderboard_view"
  | "duel_created"
  | "shop_view"
  | "card_view"
  | "profile_view"
  | "duel_club_member"
  | "card_compare"
  | "badges_view";

/**
 * Hook pour tracker les événements contextuels (quêtes).
 * Déduplique les appels pour éviter le spam (1 appel par metric par session).
 */
export function useQuestTracker() {
  const { status } = useSession();
  const trackedRef = useRef<Set<string>>(new Set());

  const track = useCallback(
    (metric: QuestMetric) => {
      if (status !== "authenticated") return;
      // Déduplique par metric pour cette session
      if (trackedRef.current.has(metric)) return;
      trackedRef.current.add(metric);

      // Fire-and-forget
      fetch("/api/quests/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric }),
      }).catch(() => {
        // Silently ignore — quêtes non-critiques
      });
    },
    [status],
  );

  return { track };
}
