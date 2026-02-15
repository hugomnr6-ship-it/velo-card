import type { ComputedStats, Badge } from "@/types";

interface BadgeDefinition extends Badge {
  priority: number;
  condition: (stats: ComputedStats) => boolean;
}

const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "complet",
    name: "Complet",
    emoji: "complet",
    priority: 0,
    condition: (s) =>
      s.pac >= 40 && s.end >= 40 && s.mon >= 40 &&
      s.res >= 40 && s.spr >= 40 && s.val >= 40,
  },
  {
    id: "chevre",
    name: "Chevre",
    emoji: "chevre",
    priority: 1,
    condition: (s) => s.mon >= 60,
  },
  {
    id: "aero",
    name: "Aero",
    emoji: "aero",
    priority: 2,
    condition: (s) => s.pac >= 60 && s.mon < 30,
  },
  {
    id: "diesel",
    name: "Diesel",
    emoji: "diesel",
    priority: 3,
    condition: (s) => s.end >= 60,
  },
  {
    id: "flandrien",
    name: "Flandrien",
    emoji: "flandrien",
    priority: 4,
    condition: (s) => s.pac >= 40 && s.end >= 40 && s.mon >= 40,
  },
  {
    id: "grimpeur",
    name: "Grimpeur",
    emoji: "grimpeur",
    priority: 5,
    condition: (s) => s.mon >= 50 && s.end >= 50,
  },
  {
    id: "puncheur",
    name: "Puncheur",
    emoji: "puncheur",
    priority: 6,
    condition: (s) => s.pac >= 30 && s.mon >= 40,
  },
  {
    id: "explosif",
    name: "Explosif",
    emoji: "explosif",
    priority: 7,
    condition: (s) => s.spr >= 60,
  },
  {
    id: "technicien",
    name: "Technicien",
    emoji: "technicien",
    priority: 8,
    condition: (s) => s.val >= 60,
  },
];

/**
 * Compute up to 3 PlayStyle badges based on the rider's stats.
 */
export function computeBadges(stats: ComputedStats): Badge[] {
  return badgeDefinitions
    .filter((b) => b.condition(stats))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(({ id, name, emoji }) => ({ id, name, emoji }));
}
