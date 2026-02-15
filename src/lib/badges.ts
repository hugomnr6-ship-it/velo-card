import type { ComputedStats, Badge } from "@/types";

interface BadgeDefinition extends Badge {
  priority: number;
  condition: (stats: ComputedStats) => boolean;
}

/* ═══ PlayStyle Badges (original 9 — computed from stats) ═══ */

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

/* ═══ Achievement Badges — All 24 definitions ═══ */

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "progression" | "social" | "performance";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const allBadgeDefinitions: AchievementBadge[] = [
  // Progression (5)
  { id: "first_sync", name: "Premiere Sync", description: "Connecte ton compte Strava", icon: "\uD83D\uDD17", category: "progression", rarity: "common" },
  { id: "week_streak_4", name: "Regulier", description: "4 semaines d'affilee", icon: "\uD83D\uDD25", category: "progression", rarity: "rare" },
  { id: "week_streak_12", name: "Machine", description: "12 semaines d'affilee", icon: "\u26A1", category: "progression", rarity: "epic" },
  { id: "tier_up_once", name: "En Progression", description: "Monte d'un tier", icon: "\u2B06\uFE0F", category: "progression", rarity: "common" },
  { id: "reached_diamant", name: "Diamant", description: "Atteins le tier Diamant", icon: "\uD83D\uDC8E", category: "progression", rarity: "legendary" },
  // Social (5)
  { id: "first_duel", name: "Premier Duel", description: "Participe a ton premier duel", icon: "\u2694\uFE0F", category: "social", rarity: "common" },
  { id: "duel_win_5", name: "Duelliste", description: "Gagne 5 duels", icon: "\uD83C\uDFC6", category: "social", rarity: "rare" },
  { id: "first_war", name: "Guerrier", description: "Participe a une guerre", icon: "\uD83D\uDEE1\uFE0F", category: "social", rarity: "common" },
  { id: "club_joined", name: "Membre", description: "Rejoins un club", icon: "\uD83E\uDD1D", category: "social", rarity: "common" },
  { id: "echappee_once", name: "Echappee", description: "Selectionne dans l'Echappee", icon: "\u2B50", category: "social", rarity: "epic" },
  // Performance (5)
  { id: "century_ride", name: "Centurion", description: "END >= 50", icon: "\uD83D\uDEB4", category: "performance", rarity: "rare" },
  { id: "summit_hunter", name: "Chasseur de Sommets", description: "MON >= 60", icon: "\u26F0\uFE0F", category: "performance", rarity: "rare" },
  { id: "speed_demon", name: "Demon de Vitesse", description: "PAC >= 70", icon: "\uD83D\uDCA8", category: "performance", rarity: "epic" },
  { id: "iron_legs", name: "Jambes d'Acier", description: "RES >= 60", icon: "\uD83E\uDDBF", category: "performance", rarity: "rare" },
  { id: "mountain_goat", name: "Chevre de Montagne", description: "MON >= 80", icon: "\uD83D\uDC10", category: "performance", rarity: "legendary" },
];

export const badgeMap = new Map(allBadgeDefinitions.map((b) => [b.id, b]));
