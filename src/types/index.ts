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

// ——— Computed stats (6 active stats + OVR) ———

export interface ComputedStats {
  pac: number;   // Vitesse / Pace
  mon: number;   // Montagne / Climbing
  val: number;   // Vallonné / Technique
  spr: number;   // Sprint / Explosivité
  end: number;   // Endurance
  res: number;   // Résistance / Puissance
  ovr: number;   // Overall Rating (calculé)
}

export type CardTier = "bronze" | "argent" | "platine" | "diamant" | "legende";

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
  custom_avatar_url?: string | null;
  club_name: string | null;
  club_logo_url: string | null;
  bio?: string;
  favorite_climb?: string;
  bike_name?: string;
  region?: string;
  created_at: string;
}

// ——— Achievement badges (DB shape) ———

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "progression" | "social" | "performance";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserStats {
  id: string;
  user_id: string; // FK -> profiles.id
  pac: number;
  end: number;
  mon: number;
  res: number;
  spr: number;
  val: number;
  ovr: number;
  tier: CardTier;
  last_synced_at: string;
  // Monday Update deltas
  prev_pac: number;
  prev_end: number;
  prev_mon: number;
  prev_res: number;
  prev_spr: number;
  prev_val: number;
  prev_ovr: number;
  prev_tier: CardTier;
  last_activity_date: string | null;
  active_weeks_streak: number;
  special_card: SpecialCardType | null;
}

// ——— Special Card Types ———
export type SpecialCardType = "totw" | "in_form" | "legend_moment" | "beta_tester";

// ——— Stat Deltas (computed client-side) ———
export interface StatDeltas {
  pac: number;
  end: number;
  mon: number;
  res: number;
  spr: number;
  val: number;
  ovr: number;
  tierChanged: boolean;
  previousTier: CardTier;
}

// ——— Stats History (weekly snapshot) ———
export interface StatsHistoryEntry {
  week_label: string;
  pac: number;
  end: number;
  mon: number;
  res: number;
  spr: number;
  val: number;
  ovr: number;
  tier: CardTier;
  special_card: SpecialCardType | null;
  weekly_km: number;
  weekly_dplus: number;
  weekly_rides: number;
}

// ——— L'Échappée de la Semaine (sélection hebdo des meilleurs) ———
export type EchappeeCategory = "ovr" | "pac" | "mon" | "spr" | "end" | "res" | "val" | "progression";

export interface EchappeeEntry {
  week_label: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  category: EchappeeCategory;
  stat_value: number;
  tier: CardTier;
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
  totalElevationLoss: number; // D- in meters
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
  windGust?: number; // gusts in km/h (optional)
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

// ——— Federation & Category types ———
export type Federation = "FFC" | "UFOLEP" | "FSGT" | "OTHER";
export type RaceGender = "H" | "F" | "MIXTE";
export type RaceStatus = "upcoming" | "past" | "cancelled";

export interface Race {
  id: string;
  creator_id: string | null;
  name: string;
  date: string;
  location: string;
  description: string;
  federation: Federation;
  category: string;
  gender: RaceGender;
  distance_km: number | null;
  elevation_gain: number | null;
  rdi_score: number | null;
  is_official: boolean;
  department: string | null;
  region: string | null;
  gpx_data: any | null;
  weather_cache: any | null;
  source_url: string | null;
  status: RaceStatus;
  created_at: string;
}

export interface RaceWithCreator extends Race {
  creator: { username: string; avatar_url: string | null } | null;
  participant_count: number;
}

export interface RaceParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  pac: number;
  end: number;
  mon: number;
  ovr: number;
  tier: CardTier;
  joined_at: string;
}

export interface RaceDetail extends Race {
  creator: { username: string; avatar_url: string | null } | null;
  participants: RaceParticipant[];
  is_creator: boolean;
  is_participant: boolean;
}

export interface CreateRaceInput {
  name: string;
  date: string;
  location: string;
  description: string;
  federation?: Federation;
  category?: string;
  gender?: RaceGender;
  distance_km?: number;
  elevation_gain?: number;
  department?: string;
  region?: string;
  is_official?: boolean;
  source_url?: string;
}

// ——— Race Points (ranking by real results) ———
export interface RacePoints {
  id: string;
  user_id: string;
  race_id: string;
  points: number;
  position: number;
  total_participants: number;
  created_at: string;
}

export interface PalmaresEntry {
  race_id: string;
  race_name: string;
  race_date: string;
  position: number;
  total_participants: number;
  points: number;
  federation: Federation;
}

export interface PalmaresSummary {
  victories: number;
  podiums: number;
  races_completed: number;
  total_points: number;
  entries: PalmaresEntry[];
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
  pac: number;
  mon: number;
  val: number;
  spr: number;
  end: number;
  res: number;
  ovr: number;
}

export type LeaderboardSort = "weekly_km" | "weekly_dplus" | "card_score" | "ovr" | "pac" | "mon" | "val" | "spr" | "end" | "res";

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
  mon: number;
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

// ——— Phase 2: Duels Head-to-Head ———

export type DuelCategory = "ovr" | "pac" | "mon" | "val" | "spr" | "end" | "res" | "weekly_km" | "weekly_dplus" | "weekly_rides";
export type DuelType = "instant" | "weekly";
export type DuelStatus = "pending" | "accepted" | "resolved" | "declined" | "expired";

export interface Duel {
  id: string;
  challenger_id: string;
  opponent_id: string;
  category: DuelCategory;
  duel_type: DuelType;
  stake: number;
  status: DuelStatus;
  challenger_value: number | null;
  opponent_value: number | null;
  winner_id: string | null;
  is_draw: boolean;
  week_label: string | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  expires_at: string;
}

export interface DuelWithPlayers extends Duel {
  challenger: { username: string; avatar_url: string | null; ovr: number; tier: CardTier };
  opponent: { username: string; avatar_url: string | null; ovr: number; tier: CardTier };
}

export interface DuelStats {
  wins: number;
  losses: number;
  draws: number;
  ego_points: number;
}

export interface CreateDuelInput {
  opponent_id: string;
  category: DuelCategory;
  duel_type: DuelType;
  stake: number;
}

export const DUEL_CATEGORY_LABELS: Record<DuelCategory, { label: string; emoji: string; short: string }> = {
  ovr: { label: "Overall", emoji: "ovr", short: "OVR" },
  pac: { label: "Vitesse", emoji: "pac", short: "VIT" },
  mon: { label: "Grimpeur", emoji: "mon", short: "MON" },
  val: { label: "Technique", emoji: "val", short: "TEC" },
  spr: { label: "Sprint", emoji: "spr", short: "SPR" },
  end: { label: "Endurance", emoji: "end", short: "END" },
  res: { label: "Puissance", emoji: "res", short: "PUI" },
  weekly_km: { label: "KM Hebdo", emoji: "weekly_km", short: "KM" },
  weekly_dplus: { label: "D+ Hebdo", emoji: "weekly_dplus", short: "D+" },
  weekly_rides: { label: "Sorties Hebdo", emoji: "weekly_rides", short: "×" },
};

// ——— Phase: Ghost Cards (Growth Hack) ———

export interface RaceResult {
  id: string;
  race_id: string;
  position: number;
  rider_name: string;
  finish_time: number; // seconds
  gen_score: number;
  ghost_id: string | null;
  user_id: string | null;
}

export interface GhostProfile {
  id: string;
  race_id: string;
  rider_name: string;
  gen_score: number;
  tier: CardTier;
  claim_token: string;
  claimed_by: string | null;
  created_at: string;
}

export interface RaceResultInput {
  position: number;
  rider_name: string;
  finish_time_str: string; // "HH:MM:SS"
}

export interface RaceResultView {
  position: number;
  rider_name: string;
  finish_time: number; // seconds
  gen_score: number;
  is_ghost: boolean;
  ghost_claim_token: string | null;
  avatar_url: string | null;
  tier: CardTier;
  user_id: string | null;
}

export interface RaceEngage {
  id: string;
  rider_name: string;
  user_id: string | null;
  bib_number: number | null;
  club: string | null;
  category: string | null;
  // Enriched from profile (if matched)
  username: string | null;
  avatar_url: string | null;
  ovr: number | null;
  tier: CardTier | null;
}

export interface RaceDetailWithResults extends RaceDetail {
  results: RaceResultView[];
  results_published: boolean;
  race_time: number;      // seconds (winner time)
  avg_speed: number;      // km/h
  engages: RaceEngage[];
}

// ——— Gamification: VeloCoins ———

export interface CoinBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ——— Gamification: Quests ———

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  quest_type: "daily" | "weekly";
  target_value: number;
  target_metric: string;
  coin_reward: number;
}

export interface UserQuest {
  id: string;
  quest_id: string;
  quest: QuestDefinition;
  current_value: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  coin_claimed: boolean;
}

// ——— Gamification: Packs ———

export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost_coins: number;
  items_count: number;
}

export interface PackItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  item_type: "stat_boost" | "skin" | "coins" | "badge";
  rarity: "common" | "rare" | "epic" | "legendary";
  effect: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  item: PackItem;
  obtained_from: string;
  is_active: boolean;
  expires_at: string | null;
  equipped: boolean;
  created_at: string;
}

// ——— Gamification: Seasons ———

export interface Season {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "finished";
}

export interface SeasonRanking {
  user_id: string;
  username: string;
  avatar_url: string | null;
  season_points: number;
  rank: number;
  total_km: number;
  duels_won: number;
  quests_completed: number;
}

// ——— Gamification: Tournaments ———

export interface Tournament {
  id: string;
  name: string;
  tournament_type: "regional" | "national" | "custom";
  category: string;
  max_participants: number;
  entry_cost_coins: number;
  prize_pool_coins: number;
  status: "registration" | "active" | "finished";
  participants_count: number;
  starts_at: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  match_number: number;
  player_a: { id: string; username: string; ovr: number } | null;
  player_b: { id: string; username: string; ovr: number } | null;
  winner_id: string | null;
  player_a_value: number | null;
  player_b_value: number | null;
  status: "pending" | "active" | "finished" | "bye";
}

// ——— Gamification: Card Skins ———

export interface CardSkin {
  id: string;
  name: string;
  description: string;
  skin_type: "border" | "background" | "effect" | "full";
  rarity: "common" | "rare" | "epic" | "legendary";
  preview_url?: string;
}

// ——— Fantasy Cycling ———

export interface FantasyLeague {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  is_public: boolean;
  entry_fee: number;
  max_participants: number;
  duration_weeks: 4 | 8;
  status: "draft" | "active" | "completed";
  prize_pool: number;
  draft_budget: number;
  start_date: string | null;
  end_date: string | null;
  current_week: number;
  created_at: string;
  participant_count?: number;
  creator?: Pick<Profile, "id" | "username" | "avatar_url">;
}

export interface FantasyParticipant {
  id: string;
  league_id: string;
  user_id: string;
  total_points: number;
  weekly_points: number;
  rank: number | null;
  transfers_remaining: number;
  joined_at: string;
  user?: Pick<Profile, "id" | "username" | "avatar_url">;
  team?: FantasyTeamMember[];
}

export interface FantasyTeamMember {
  id: string;
  participant_id: string;
  cyclist_id: string;
  is_captain: boolean;
  is_super_sub: boolean;
  draft_cost: number;
  acquired_at: string;
  cyclist?: Pick<Profile, "id" | "username" | "avatar_url"> & {
    ovr: number;
    tier: CardTier;
    pac: number;
    mon: number;
    val: number;
    spr: number;
    end: number;
    res: number;
    weekly_km?: number;
    weekly_elevation?: number;
  };
}

export interface FantasyWeeklyScore {
  id: string;
  participant_id: string;
  week_number: number;
  total_score: number;
  breakdown: Record<string, {
    name: string;
    base_points: number;
    captain_bonus: boolean;
    super_sub_used: boolean;
    details: {
      km: number;
      elevation: number;
      ovr_change: number;
      tier_up: boolean;
      duels_won: number;
      totw: boolean;
    };
  }>;
  calculated_at: string;
}

export interface FantasyTransfer {
  id: string;
  participant_id: string;
  dropped_cyclist_id: string;
  picked_cyclist_id: string;
  week_number: number;
  cost: number;
  transferred_at: string;
}

// ——— Subscription types ———

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan: "pro_monthly" | "pro_yearly";
  status: "active" | "past_due" | "canceled" | "incomplete" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  type: "subscription" | "coins_purchase" | "pack_purchase";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: "pending" | "completed" | "rewarded";
  reward_given: boolean;
  created_at: string;
}
