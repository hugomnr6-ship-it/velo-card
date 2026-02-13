// ——— Strava API types ———

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  start_date: string;
  type: string;
}

// ——— Computed stats (Phase 1: "3+3") ———

export interface ComputedStats {
  pac: number; // speed score (weighted by elevation)
  end: number; // endurance score (max distance)
  grim: number; // climbing score (D+ / VAM)
}

// The 3 locked stats for Phase 1
export interface LockedStats {
  pui: null; // power — requires sensor
  exp: null; // explosivity — requires sensor
  tec: null; // technique — requires sensor
}

export type CardTier = "bronze" | "silver" | "gold";

// ——— Badges PlayStyles ———

export interface Badge {
  id: string;
  name: string;
  emoji: string;
}

// ——— DB row shapes ———

export interface Profile {
  id: string;
  strava_id: number;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string; // FK -> profiles.id
  pac: number;
  end: number;
  grim: number;
  tier: CardTier;
  last_synced_at: string;
}

// ——— Phase 2: GPX & Route types ———

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number; // elevation in meters
  distFromStart: number; // cumulative distance from start in km
}

export interface RouteSummary {
  totalDistanceKm: number;
  totalElevationGain: number; // D+ in meters
  maxElevation: number;
  minElevation: number;
  points: GpxPoint[];
  centerLat: number; // midpoint for weather API
  centerLon: number;
}

// ——— Phase 2: Weather types ———

export interface WeatherData {
  windSpeedKmh: number;
  windDirection: string; // "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"
  windDegrees: number;
  temperature: number; // Celsius
  description: string;
  icon: string; // OpenWeatherMap icon code
}

// ——— Phase 2: RDI types ———

export type RdiLabel = "Facile" | "Modéré" | "Difficile" | "Extrême";

export interface RdiResult {
  score: number; // 0-100
  label: RdiLabel;
}

// ——— Phase 3: Social Retention types ———

export const FRENCH_REGIONS = [
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
] as const;

export type FrenchRegion = (typeof FRENCH_REGIONS)[number];

export interface Race {
  id: string;
  creator_id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  created_at: string;
}

export interface RaceWithCreator extends Race {
  creator: { username: string; avatar_url: string | null };
  participant_count: number;
}

export interface RaceParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  pac: number;
  end: number;
  grim: number;
  tier: CardTier;
  joined_at: string;
}

export interface RaceDetail extends Race {
  creator: { username: string; avatar_url: string | null };
  participants: RaceParticipant[];
  is_creator: boolean;
  is_participant: boolean;
}

export interface CreateRaceInput {
  name: string;
  date: string;
  location: string;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  weekly_km: number;
  weekly_dplus: number;
  card_score: number;
  tier: CardTier;
}

export type LeaderboardSort = "weekly_km" | "weekly_dplus" | "card_score";
