import type { ComputedStats, Badge } from "@/types";

interface BadgeDefinition extends Badge {
  priority: number;
  condition: (stats: ComputedStats) => boolean;
}

const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "complet",
    name: "Complet",
    emoji: "\uD83C\uDFC6",
    priority: 0,
    condition: (s) =>
      s.pac >= 40 && s.end >= 40 && s.grim >= 40 &&
      s.pui >= 40 && s.exp >= 40 && s.tec >= 40,
  },
  {
    id: "chevre",
    name: "Chevre",
    emoji: "\uD83D\uDC10",
    priority: 1,
    condition: (s) => s.grim >= 60,
  },
  {
    id: "aero",
    name: "Aero",
    emoji: "\uD83D\uDE80",
    priority: 2,
    condition: (s) => s.pac >= 60 && s.grim < 30,
  },
  {
    id: "diesel",
    name: "Diesel",
    emoji: "\uD83D\uDD25",
    priority: 3,
    condition: (s) => s.end >= 60,
  },
  {
    id: "flandrien",
    name: "Flandrien",
    emoji: "\uD83D\uDEE1\uFE0F",
    priority: 4,
    condition: (s) => s.pac >= 40 && s.end >= 40 && s.grim >= 40,
  },
  {
    id: "grimpeur",
    name: "Grimpeur",
    emoji: "\uD83C\uDFD4\uFE0F",
    priority: 5,
    condition: (s) => s.grim >= 50 && s.end >= 50,
  },
  {
    id: "puncheur",
    name: "Puncheur",
    emoji: "\u26A1",
    priority: 6,
    condition: (s) => s.pac >= 30 && s.grim >= 40,
  },
  {
    id: "explosif",
    name: "Explosif",
    emoji: "\uD83D\uDCA5",
    priority: 7,
    condition: (s) => s.exp >= 60,
  },
  {
    id: "technicien",
    name: "Technicien",
    emoji: "\uD83C\uDFAF",
    priority: 8,
    condition: (s) => s.tec >= 60,
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
