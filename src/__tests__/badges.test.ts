import { describe, it, expect } from "vitest";
import { computeBadges, allBadgeDefinitions, badgeMap } from "@/lib/badges";
import type { ComputedStats } from "@/types";

function makeStats(overrides: Partial<ComputedStats> = {}): ComputedStats {
  return {
    pac: 30,
    end: 30,
    mon: 30,
    res: 30,
    spr: 30,
    val: 30,
    ovr: 30,
    ...overrides,
  };
}

describe("computeBadges", () => {
  it("returns empty array for low stats", () => {
    const badges = computeBadges(makeStats({ pac: 10, end: 10, mon: 10 }));
    expect(badges.length).toBe(0);
  });

  it("returns Complet badge when all stats >= 40", () => {
    const badges = computeBadges(makeStats({
      pac: 40, end: 40, mon: 40, res: 40, spr: 40, val: 40,
    }));
    expect(badges.some((b) => b.id === "complet")).toBe(true);
  });

  it("returns Chevre badge for MON >= 60", () => {
    const badges = computeBadges(makeStats({ mon: 60 }));
    expect(badges.some((b) => b.id === "chevre")).toBe(true);
  });

  it("returns Aero badge for PAC >= 60 and MON < 30", () => {
    const badges = computeBadges(makeStats({ pac: 60, mon: 20 }));
    expect(badges.some((b) => b.id === "aero")).toBe(true);
  });

  it("returns Diesel badge for END >= 60", () => {
    const badges = computeBadges(makeStats({ end: 60 }));
    expect(badges.some((b) => b.id === "diesel")).toBe(true);
  });

  it("returns max 3 badges", () => {
    const badges = computeBadges(makeStats({
      pac: 70, end: 70, mon: 70, res: 70, spr: 70, val: 70,
    }));
    expect(badges.length).toBeLessThanOrEqual(3);
  });

  it("returns badges with id, name, emoji", () => {
    const badges = computeBadges(makeStats({ mon: 60 }));
    if (badges.length > 0) {
      expect(badges[0]).toHaveProperty("id");
      expect(badges[0]).toHaveProperty("name");
      expect(badges[0]).toHaveProperty("emoji");
    }
  });

  it("returns Explosif for SPR >= 60", () => {
    const badges = computeBadges(makeStats({ spr: 60 }));
    expect(badges.some((b) => b.id === "explosif")).toBe(true);
  });

  it("returns Technicien for VAL >= 60", () => {
    const badges = computeBadges(makeStats({ val: 60 }));
    expect(badges.some((b) => b.id === "technicien")).toBe(true);
  });
});

describe("allBadgeDefinitions", () => {
  it("has at least 24 badge definitions", () => {
    expect(allBadgeDefinitions.length).toBeGreaterThanOrEqual(24);
  });

  it("all badges have required fields", () => {
    for (const badge of allBadgeDefinitions) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(["progression", "social", "performance", "race"]).toContain(badge.category);
      expect(["common", "rare", "epic", "legendary"]).toContain(badge.rarity);
    }
  });

  it("all badge IDs are unique", () => {
    const ids = allBadgeDefinitions.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes fantasy badges", () => {
    const ids = allBadgeDefinitions.map((b) => b.id);
    expect(ids).toContain("fantasy_first_league");
    expect(ids).toContain("fantasy_champion");
    expect(ids).toContain("fantasy_draft_master");
    expect(ids).toContain("fantasy_streak");
  });

  it("includes race badges", () => {
    const ids = allBadgeDefinitions.map((b) => b.id);
    expect(ids).toContain("race_first_win");
    expect(ids).toContain("race_podium_3");
    expect(ids).toContain("race_10_starts");
  });

  it("includes duel badges", () => {
    const ids = allBadgeDefinitions.map((b) => b.id);
    expect(ids).toContain("duel_win_10");
    expect(ids).toContain("duel_win_25");
    expect(ids).toContain("duel_streak_5");
  });
});

describe("badgeMap", () => {
  it("contains all badge definitions", () => {
    expect(badgeMap.size).toBe(allBadgeDefinitions.length);
  });

  it("retrieves badge by ID", () => {
    const badge = badgeMap.get("first_sync");
    expect(badge).toBeTruthy();
    expect(badge?.name).toBe("Premiere Sync");
  });

  it("returns undefined for unknown badge ID", () => {
    expect(badgeMap.get("nonexistent")).toBeUndefined();
  });
});
