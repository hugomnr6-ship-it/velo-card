/**
 * Centralized economy configuration.
 * All VeloCoins values and game constants in one place.
 * NO magic numbers anywhere else.
 */
export const ECONOMY = {
  // ——— Gains de coins ———
  COINS_PER_KM: 10,
  COINS_DUEL_WIN: 50,
  COINS_WAR_WIN: 100,
  COINS_TOTW_SELECTED: 200,
  COINS_BADGE_EARNED: 25,
  COINS_WAR_LOSS: 25,

  // ——— Streak bonus ———
  STREAK_BONUS_INTERVAL: 5, // every N weeks
  STREAK_BONUS_MULTIPLIER: 10, // streak × multiplier

  // @deprecated — replaced by shop rotation system
  PACK_COST: { bronze: 150, silver: 300, gold: 750 } as Record<string, number>,

  // ——— Shop skin prices (reference) ———
  SKIN_PRICE: {
    common: 300,
    rare: 500,
    epic: 900,
    legendary: 1500,
  } as Record<string, number>,

  SHOP_ROTATION_DAYS: 7,

  // ——— Season points ———
  SEASON_POINTS_PER_KM: 1,
  SEASON_POINTS_DUEL_WIN: 20,
  SEASON_POINTS_QUEST_COMPLETE: 15,
  SEASON_POINTS_WAR_WIN: 30,
  SEASON_POINTS_RACE_PODIUM: 50,
  SEASON_POINTS_RACE_WIN: 100,

  // ——— Season rewards ———
  SEASON_REWARD_FIRST: 5000,
  SEASON_REWARD_2ND_3RD: 3000,
  SEASON_REWARD_TOP10: 1500,
  SEASON_REWARD_TOP50: 500,
  SEASON_REWARD_DEFAULT: 100,

  // ——— Tournament ———
  TOURNAMENT_PRIZE_WINNER_PCT: 0.6,

  // ——— Fantasy Cycling ———
  FANTASY_ENTRY_OPTIONS: [0, 50, 100, 200] as readonly number[],
  FANTASY_DRAFT_BUDGET: 1000,
  FANTASY_CYCLIST_COST_MULTIPLIER: 10, // OVR × 10
  FANTASY_PRIZE_DISTRIBUTION: [0.5, 0.3, 0.2] as readonly number[],
  FANTASY_EXTRA_TRANSFER_COST: 50,
  FANTASY_MIN_PARTICIPANTS: 4,
  FANTASY_TEAM_SIZE: 5,

  // Fantasy scoring
  FANTASY_POINTS_PER_10KM: 1,
  FANTASY_POINTS_PER_100M_ELEV: 1,
  FANTASY_POINTS_OVR_UP: 3,
  FANTASY_POINTS_TIER_UP: 5,
  FANTASY_POINTS_DUEL_WIN: 2,
  FANTASY_POINTS_TOTW: 10,
  FANTASY_CAPTAIN_MULTIPLIER: 2,
} as const;
