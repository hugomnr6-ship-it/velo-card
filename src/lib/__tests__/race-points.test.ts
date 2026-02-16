import { describe, it, expect } from "vitest";
import { getRaceBonus, computeRacePoints } from "@/lib/race-points";

describe("getRaceBonus", () => {
  it("gives max bonus for 1st place", () => {
    const bonus = getRaceBonus(1, 50);
    expect(bonus.resBoost).toBe(5);
    expect(bonus.ovrBoost).toBe(3);
    expect(bonus.badge).toBe("race_winner");
  });
  it("gives podium bonus for 2nd-3rd place", () => {
    const bonus2 = getRaceBonus(2, 50);
    expect(bonus2.resBoost).toBe(3);
    expect(bonus2.ovrBoost).toBe(2);
    expect(bonus2.badge).toBe("race_podium");

    const bonus3 = getRaceBonus(3, 50);
    expect(bonus3.resBoost).toBe(3);
    expect(bonus3.badge).toBe("race_podium");
  });
  it("gives top10 bonus for 4th-10th place", () => {
    const bonus = getRaceBonus(5, 50);
    expect(bonus.resBoost).toBe(2);
    expect(bonus.ovrBoost).toBe(1);
    expect(bonus.badge).toBeNull();
  });
  it("gives zero for positions beyond top 10", () => {
    const bonus = getRaceBonus(11, 50);
    expect(bonus.resBoost).toBe(0);
    expect(bonus.ovrBoost).toBe(0);
    expect(bonus.badge).toBeNull();
  });
  it("gives zero for last place", () => {
    const bonus = getRaceBonus(50, 50);
    expect(bonus.resBoost).toBe(0);
    expect(bonus.ovrBoost).toBe(0);
  });
});

describe("computeRacePoints", () => {
  it("gives max points for 1st place FFC", () => {
    const points = computeRacePoints(1, 50, "FFC");
    expect(points).toBe(120); // 1.0 * 100 * 1.2
  });
  it("gives minimal points for last place", () => {
    const points = computeRacePoints(50, 50);
    // Formula: (1 - 49/50) * 100 * 0.7 = 1.4 → rounds to 1
    expect(points).toBeLessThanOrEqual(2);
  });
  it("handles invalid inputs", () => {
    expect(computeRacePoints(0, 50)).toBe(0);
    expect(computeRacePoints(1, 0)).toBe(0);
  });
  it("applies federation coefficients", () => {
    const ffc = computeRacePoints(1, 100, "FFC");
    const ufolep = computeRacePoints(1, 100, "UFOLEP");
    const fsgt = computeRacePoints(1, 100, "FSGT");
    expect(ffc).toBeGreaterThan(ufolep);
    expect(ufolep).toBeGreaterThan(fsgt);
  });
});
