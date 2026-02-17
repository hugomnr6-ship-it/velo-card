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
  category: "progression" | "social" | "performance" | "race";
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
  // Race badges (8)
  { id: "race_first_win", name: "Premiere Victoire", description: "Remporte ta premiere course", icon: "\uD83E\uDD47", category: "race", rarity: "epic" },
  { id: "race_podium_3", name: "Podium Machine", description: "3 podiums au total", icon: "\uD83C\uDFC5", category: "race", rarity: "rare" },
  { id: "race_10_starts", name: "Decathlonien", description: "10 courses disputees", icon: "\uD83C\uDFCE\uFE0F", category: "race", rarity: "rare" },
  { id: "race_iron_man", name: "Iron Man", description: "5 courses en 30 jours", icon: "\uD83D\uDCAA", category: "race", rarity: "epic" },
  { id: "race_serial_winner", name: "Serial Winner", description: "3 victoires en une saison", icon: "\uD83D\uDD25", category: "race", rarity: "legendary" },
  { id: "race_mountain_king", name: "Roi des Cimes", description: "Victoire sur course RDI >= 7", icon: "\uD83D\uDC51", category: "race", rarity: "epic" },
  { id: "race_centurion", name: "Costaud", description: "Finir une course de +100km", icon: "\uD83E\uDDBE", category: "race", rarity: "rare" },
  { id: "race_climber", name: "Grimpeur Confirme", description: "3 top 10 en course montagne", icon: "\u26F0\uFE0F", category: "race", rarity: "epic" },
  // Duel badges (new)
  { id: "duel_win_10", name: "Duelliste Confirme", description: "Gagne 10 duels", icon: "\u2694\uFE0F", category: "social", rarity: "epic" },
  { id: "duel_win_25", name: "Gladiateur", description: "Gagne 25 duels", icon: "\uD83D\uDDE1\uFE0F", category: "social", rarity: "legendary" },
  { id: "duel_streak_5", name: "Invincible", description: "5 duels gagnes d'affilee", icon: "\uD83D\uDEE1\uFE0F", category: "social", rarity: "epic" },
  // War badges (new)
  { id: "war_veteran_5", name: "Veteran de Guerre", description: "Participe a 5 guerres", icon: "\uD83C\uDF96\uFE0F", category: "social", rarity: "rare" },
  { id: "war_champion_3", name: "Champion de Guerre", description: "3 guerres gagnees", icon: "\uD83C\uDFF0", category: "social", rarity: "epic" },
  { id: "war_mvp", name: "MVP de Guerre", description: "Top contributeur d'une guerre", icon: "\u2B50", category: "social", rarity: "epic" },
  // Gamification badges (new)
  { id: "first_pack", name: "Deballage", description: "Ouvre ton premier pack", icon: "\uD83D\uDCE6", category: "progression", rarity: "common" },
  { id: "pack_legendary", name: "Coup de Chance", description: "Obtiens un item legendaire dans un pack", icon: "\uD83C\uDF1F", category: "progression", rarity: "legendary" },
  { id: "quest_master_10", name: "Maitre des Quetes", description: "Complete 10 quetes", icon: "\uD83C\uDFAF", category: "progression", rarity: "rare" },
  { id: "quest_master_50", name: "Legende des Quetes", description: "Complete 50 quetes", icon: "\uD83D\uDC8E", category: "progression", rarity: "epic" },
  { id: "coins_1000", name: "Riche", description: "Accumule 1000 VeloCoins", icon: "\uD83D\uDCB0", category: "progression", rarity: "rare" },
  { id: "coins_10000", name: "Millionnaire", description: "Accumule 10000 VeloCoins", icon: "\uD83E\uDD11", category: "progression", rarity: "legendary" },
  { id: "season_top10", name: "Top 10 Saisonnier", description: "Finis dans le top 10 d'une saison", icon: "\uD83C\uDFC5", category: "social", rarity: "legendary" },
  { id: "tournament_winner", name: "Champion de Tournoi", description: "Gagne un tournoi", icon: "\uD83C\uDFC6", category: "social", rarity: "legendary" },
  // Fantasy badges (4)
  { id: "fantasy_first_league", name: "Manager Debutant", description: "Rejoins ta premiere ligue Fantasy", icon: "\u26BD", category: "social", rarity: "common" },
  { id: "fantasy_champion", name: "Champion Fantasy", description: "Gagne une ligue Fantasy", icon: "\uD83C\uDFC6", category: "social", rarity: "legendary" },
  { id: "fantasy_draft_master", name: "Oeil de Scout", description: "Compose une equipe complete 5/5", icon: "\uD83D\uDC41\uFE0F", category: "social", rarity: "rare" },
  { id: "fantasy_streak", name: "Meilleur Chaque Semaine", description: "Termine 1er 3 semaines d'affilee", icon: "\uD83D\uDD25", category: "social", rarity: "epic" },
];

export const badgeMap = new Map(allBadgeDefinitions.map((b) => [b.id, b]));
