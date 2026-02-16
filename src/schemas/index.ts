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
  sort: z.enum(["weekly_km", "weekly_dplus", "card_score", "ovr", "pac", "mon", "val", "spr", "end", "res"]).default("weekly_km"),
});

export const racesQuerySchema = z.object({
  federation: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  search: z.string().max(200).optional(),
  upcoming: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
