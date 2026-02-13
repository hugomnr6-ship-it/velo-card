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
  weighted_average_watts?: number; // Strava estimated power (may be absent)
  start_date: string;
  type: string;
}

// ——— Computed stats (6 active stats) ———

export interface ComputedStats {
  pac: number; // speed score (weighted by elevation)
  end: number; // endurance score (max distance)
  grim: number; // climbing score (D+ / VAM)
  pui: number; // power score (watts or physics estimate)
  exp: number; // explosivity (max_speed / avg_speed ratio)
  tec: number; // technique (pacing + consistency)
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
  club_name: string | null;
  club_logo_url: string | null;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string; // FK -> profiles.id
  pac: number;
  end: number;
  grim: number;
  pui: number;
  exp: number;
  tec: number;
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

// ——— Phase: Clubs ———

export interface Club {
  id: string;
  name: string;
  logo_url: string | null;
  creator_id: string;
  created_at: string;
}

export interface ClubWithCount extends Club {
  member_count: number;
  creator: { username: string; avatar_url: string | null };
}

export interface ClubMember {
  user_id: string;
  username: string;
  avatar_url: string | null;
  pac: number;
  end: number;
  grim: number;
  tier: CardTier;
  joined_at: string;
}

export interface ClubInfo {
  name: string;
  logo_url: string;
}

// ——— Phase: Squad Wars (Guerre des Pelotons) ———

export type TowerType = "roi" | "montagne" | "sprint";
export type WarStatus = "active" | "finished";

export interface War {
  id: string;
  week_label: string;
  club_a_id: string;
  club_b_id: string;
  club_a_score: number;
  club_b_score: number;
  status: WarStatus;
  starts_at: string;
  ends_at: string;
}

export interface WarTower {
  tower_type: TowerType;
  current_value: number;
  target_value: number;
  is_winner: boolean;
}

export interface WarContribution {
  user_id: string;
  username: string;
  avatar_url: string | null;
  km_contributed: number;
  dplus_contributed: number;
  sprints_contributed: number;
}

export interface WarTowerView {
  my_progress: number;
  my_target: number;
  opp_progress: number;
  opp_target: number;
  my_winner: boolean;
  opp_winner: boolean;
}

export interface WarDashboard {
  war: {
    id: string;
    week_label: string;
    starts_at: string;
    ends_at: string;
    status: WarStatus;
    my_club: { id: string; name: string; logo_url: string | null; member_count: number };
    opponent_club: { id: string; name: string; logo_url: string | null; member_count: number };
    towers: {
      roi: WarTowerView;
      montagne: WarTowerView;
      sprint: WarTowerView;
    };
    my_club_towers_won: number;
    opp_club_towers_won: number;
    contributions: WarContribution[];
  } | null;
  no_club: boolean;
  club_too_small: boolean;
  no_match_found: boolean;
  is_debrief_day: boolean;
}

export interface WarHistoryEntry {
  war_id: string;
  week_label: string;
  opponent_name: string;
  opponent_logo_url: string | null;
  my_score: number;
  opp_score: number;
  result: "win" | "loss" | "draw";
  ended_at: string;
}
