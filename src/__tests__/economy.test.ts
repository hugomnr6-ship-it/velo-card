import { describe, it, expect } from "vitest";
import { ECONOMY } from "@/lib/economy";

describe("ECONOMY config", () => {
  it("has positive COINS_PER_KM", () => {
    expect(ECONOMY.COINS_PER_KM).toBeGreaterThan(0);
  });

  it("has positive COINS_DUEL_WIN", () => {
    expect(ECONOMY.COINS_DUEL_WIN).toBeGreaterThan(0);
  });

  it("has positive COINS_WAR_WIN", () => {
    expect(ECONOMY.COINS_WAR_WIN).toBeGreaterThan(0);
  });

  it("has positive COINS_TOTW_SELECTED", () => {
    expect(ECONOMY.COINS_TOTW_SELECTED).toBeGreaterThan(0);
  });

  it("has positive COINS_BADGE_EARNED", () => {
    expect(ECONOMY.COINS_BADGE_EARNED).toBeGreaterThan(0);
  });

  // ——— Fantasy config ———

  it("has FANTASY_DRAFT_BUDGET = 1000", () => {
    expect(ECONOMY.FANTASY_DRAFT_BUDGET).toBe(1000);
  });

  it("has FANTASY_TEAM_SIZE = 5", () => {
    expect(ECONOMY.FANTASY_TEAM_SIZE).toBe(5);
  });

  it("has FANTASY_MIN_PARTICIPANTS = 4", () => {
    expect(ECONOMY.FANTASY_MIN_PARTICIPANTS).toBe(4);
  });

  it("has FANTASY_CAPTAIN_MULTIPLIER = 2", () => {
    expect(ECONOMY.FANTASY_CAPTAIN_MULTIPLIER).toBe(2);
  });

  it("prize distribution sums to 1.0", () => {
    const sum = ECONOMY.FANTASY_PRIZE_DISTRIBUTION.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it("has 3 prize distribution positions", () => {
    expect(ECONOMY.FANTASY_PRIZE_DISTRIBUTION).toHaveLength(3);
  });

  it("has positive FANTASY_CYCLIST_COST_MULTIPLIER", () => {
    expect(ECONOMY.FANTASY_CYCLIST_COST_MULTIPLIER).toBeGreaterThan(0);
  });

  it("has positive FANTASY_EXTRA_TRANSFER_COST", () => {
    expect(ECONOMY.FANTASY_EXTRA_TRANSFER_COST).toBeGreaterThan(0);
  });

  // ——— Season config ———

  it("has positive SEASON_POINTS_PER_KM", () => {
    expect(ECONOMY.SEASON_POINTS_PER_KM).toBeGreaterThan(0);
  });

  it("has SEASON_REWARD_FIRST > SEASON_REWARD_DEFAULT", () => {
    expect(ECONOMY.SEASON_REWARD_FIRST).toBeGreaterThan(ECONOMY.SEASON_REWARD_DEFAULT);
  });

  // ——— Tournament config ———

  it("has TOURNAMENT_PRIZE_WINNER_PCT between 0 and 1", () => {
    expect(ECONOMY.TOURNAMENT_PRIZE_WINNER_PCT).toBeGreaterThan(0);
    expect(ECONOMY.TOURNAMENT_PRIZE_WINNER_PCT).toBeLessThanOrEqual(1);
  });

  // ——— Streak config ———

  it("has positive STREAK_BONUS_INTERVAL", () => {
    expect(ECONOMY.STREAK_BONUS_INTERVAL).toBeGreaterThan(0);
  });

  it("has positive STREAK_BONUS_MULTIPLIER", () => {
    expect(ECONOMY.STREAK_BONUS_MULTIPLIER).toBeGreaterThan(0);
  });

  // ——— Fantasy scoring ———

  it("has FANTASY_POINTS_PER_10KM >= 1", () => {
    expect(ECONOMY.FANTASY_POINTS_PER_10KM).toBeGreaterThanOrEqual(1);
  });

  it("has FANTASY_POINTS_TOTW > FANTASY_POINTS_DUEL_WIN", () => {
    expect(ECONOMY.FANTASY_POINTS_TOTW).toBeGreaterThan(ECONOMY.FANTASY_POINTS_DUEL_WIN);
  });
});
