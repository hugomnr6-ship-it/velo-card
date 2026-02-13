import type { ComputedStats, Badge } from "@/types";

interface BadgeDefinition extends Badge {
  priority: number;
  condition: (stats: ComputedStats) => boolean;
}

const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "chevre",
    name: "Chevre",
    emoji: "\uD83D\uDC10",
    priority: 1,
    condition: (s) => s.grim >= 70,
  },
  {
    id: "aero",
    name: "Aero",
    emoji: "\uD83D\uDE80",
    priority: 2,
    condition: (s) => s.pac >= 70 && s.grim < 40,
  },
  {
    id: "diesel",
    name: "Diesel",
    emoji: "\uD83D\uDD25",
    priority: 3,
    condition: (s) => s.end >= 80,
  },
  {
    id: "flandrien",
    name: "Flandrien",
    emoji: "\uD83D\uDEE1\uFE0F",
    priority: 4,
    condition: (s) => s.pac >= 50 && s.end >= 50 && s.grim >= 50,
  },
  {
    id: "grimpeur",
    name: "Grimpeur",
    emoji: "\uD83C\uDFD4\uFE0F",
    priority: 5,
    condition: (s) => s.grim >= 60 && s.end >= 60,
  },
];

/**
 * Compute up to 3 PlayStyle badges based on the rider's stats.
 * Badges are sorted by priority (highest first).
 */
export function computeBadges(stats: ComputedStats): Badge[] {
  return badgeDefinitions
    .filter((b) => b.condition(stats))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(({ id, name, emoji }) => ({ id, name, emoji }));
}
