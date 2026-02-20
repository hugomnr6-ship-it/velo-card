import { z } from "zod";

// ——— Duels ———
export const createDuelSchema = z.object({
  opponent_id: z.string().uuid("opponent_id invalide"),
  category: z.enum(["ovr", "pac", "mon", "val", "spr", "end", "res", "weekly_km", "weekly_dplus", "weekly_rides"]),
  duel_type: z.enum(["instant", "weekly"]).default("instant"),
  stake: z.number().int().min(5, "Mise minimum : 5").max(100, "Mise maximum : 100").default(10),
});

export type CreateDuelInput = z.infer<typeof createDuelSchema>;

// ——— Clubs ———
export const createClubSchema = z.object({
  name: z.string().min(1, "Nom requis").max(50, "Nom trop long (50 max)"),
});

// ——— Races ———
export const createRaceSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)"),
  location: z.string().min(1, "Lieu requis").max(200),
  description: z.string().max(2000).default(""),
  federation: z.enum(["FFC", "UFOLEP", "FSGT", "OTHER"]).default("OTHER"),
  category: z.string().max(50).default("Seniors"),
  gender: z.enum(["H", "F", "MIXTE"]).default("MIXTE"),
  distance_km: z.number().positive().optional().nullable(),
  elevation_gain: z.number().nonnegative().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  is_official: z.boolean().default(false),
  source_url: z.string().url().optional().nullable(),
});

export type CreateRaceInput = z.infer<typeof createRaceSchema>;

// ——— Profile ———
export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  favorite_climb: z.string().max(100).optional(),
  bike_name: z.string().max(100).optional(),
});

// ——— Region ———
export const updateRegionSchema = z.object({
  region: z.enum([
    "Auvergne-Rhône-Alpes",
    "Bourgogne-Franche-Comté",
    "Bretagne",
    "Centre-Val de Loire",
    "Corse",
    "Grand Est",
    "Hauts-de-France",
    "Île-de-France",
    "Normandie",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Pays de la Loire",
    "Provence-Alpes-Côte d'Azur",
  ]),
});

// ——— Search params validation ———
export const leaderboardQuerySchema = z.object({
  region: z.string().min(1, "Région requise"),
  sort: z.enum(["weekly_km", "weekly_dplus", "card_score", "ovr", "pac", "mon", "val", "spr", "end", "res", "season_points"]).default("weekly_km"),
  scope: z.enum(["region", "france", "global"]).optional().default("region"),
  period: z.enum(["weekly", "monthly", "yearly"]).optional().default("weekly"),
});

// ——— Gamification schemas ———
export const openPackSchema = z.object({
  packId: z.string().min(1),
});

export const equipSkinSchema = z.object({
  skinId: z.string().min(1),
});

export const joinTournamentSchema = z.object({
  tournamentId: z.string().uuid(),
});

export const matchmakeSchema = z.object({
  category: z.enum(["ovr", "pac", "mon", "val", "spr", "end", "res", "weekly_km", "weekly_dplus", "weekly_rides"]),
  stake: z.number().int().min(5).max(50),
});

export const showcaseBadgesSchema = z.object({
  badgeIds: z.array(z.string()).max(3),
});

export const racesQuerySchema = z.object({
  federation: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  search: z.string().max(200).optional(),
  upcoming: z.string().optional(),
  past_only: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1500),
});

// ——— Fantasy Cycling ———
export const createFantasyLeagueSchema = z.object({
  name: z.string().min(1, "Nom requis").max(50, "Nom trop long"),
  isPublic: z.boolean().default(false),
  entryFee: z.number().int().min(0).max(200).default(0),
  maxParticipants: z.number().int().min(4).max(20).default(10),
  durationWeeks: z.enum(["4", "8"]).transform(Number).default("4"),
});

export const fantasyDraftSchema = z.object({
  cyclistId: z.string().uuid("cyclistId invalide"),
  isCaptain: z.boolean().default(false),
  isSuperSub: z.boolean().default(false),
});

export const fantasyTransferSchema = z.object({
  droppedCyclistId: z.string().uuid("droppedCyclistId invalide"),
  pickedCyclistId: z.string().uuid("pickedCyclistId invalide"),
});

export const fantasyJoinSchema = z.object({
  inviteCode: z.string().min(1).max(10).optional(),
});

// ——— Marketplace ———
export const createListingSchema = z.object({
  itemType: z.enum(["skin", "boost", "badge_frame"]),
  itemId: z.string().min(1),
  price: z.number().int().min(10).max(10000),
});

export const marketplaceQuerySchema = z.object({
  type: z.enum(["skin", "boost", "badge_frame", "all"]).default("all"),
  sortBy: z.enum(["price_asc", "price_desc", "newest"]).default("newest"),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().max(10000).optional(),
});
