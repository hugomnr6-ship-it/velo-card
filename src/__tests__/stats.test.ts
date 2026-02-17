import { describe, it, expect } from "vitest";
import { computeStats, computeOVR, getTier } from "@/lib/stats";
import type { StravaActivity, ComputedStats } from "@/types";

function makeActivity(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 1,
    name: "Morning Ride",
    distance: 50000, // 50km
    moving_time: 6000, // 100min
    elapsed_time: 6600,
    total_elevation_gain: 500,
    average_speed: 8.33, // ~30km/h
    max_speed: 13.89, // ~50km/h
    start_date: "2026-01-15T08:00:00Z",
    type: "Ride",
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns all 7 stat fields", () => {
    const stats = computeStats([makeActivity()]);
    expect(stats).toHaveProperty("pac");
    expect(stats).toHaveProperty("end");
    expect(stats).toHaveProperty("mon");
    expect(stats).toHaveProperty("res");
    expect(stats).toHaveProperty("spr");
    expect(stats).toHaveProperty("val");
    expect(stats).toHaveProperty("ovr");
  });

  it("returns 0 for all stats with empty activities", () => {
    const stats = computeStats([]);
    expect(stats.pac).toBe(0);
    expect(stats.end).toBe(0);
    expect(stats.mon).toBe(0);
    expect(stats.ovr).toBe(0);
  });

  it("returns stats capped at 99", () => {
    const monster = makeActivity({
      distance: 300000,
      average_speed: 20,
      max_speed: 30,
      total_elevation_gain: 60000,
      weighted_average_watts: 500,
    });
    const stats = computeStats([monster]);
    expect(stats.pac).toBeLessThanOrEqual(99);
    expect(stats.end).toBeLessThanOrEqual(99);
    expect(stats.mon).toBeLessThanOrEqual(99);
    expect(stats.res).toBeLessThanOrEqual(99);
    expect(stats.spr).toBeLessThanOrEqual(99);
    expect(stats.val).toBeLessThanOrEqual(99);
    expect(stats.ovr).toBeLessThanOrEqual(99);
  });

  it("non-Ride activities are excluded", () => {
    const run = makeActivity({ type: "Run" });
    const stats = computeStats([run]);
    expect(stats.pac).toBe(0);
    expect(stats.end).toBe(0);
  });

  it("longer rides give higher END", () => {
    const short = computeStats([makeActivity({ distance: 20000 })]);
    const long = computeStats([makeActivity({ distance: 100000 })]);
    expect(long.end).toBeGreaterThan(short.end);
  });

  it("more elevation gives higher MON", () => {
    const flat = computeStats([makeActivity({ total_elevation_gain: 100 })]);
    const climb = computeStats([makeActivity({ total_elevation_gain: 5000 })]);
    expect(climb.mon).toBeGreaterThan(flat.mon);
  });
});

describe("computeOVR", () => {
  it("returns 0 for all-zero stats", () => {
    expect(computeOVR({ pac: 0, end: 0, mon: 0, res: 0, spr: 0, val: 0 })).toBe(0);
  });

  it("returns weighted average", () => {
    const ovr = computeOVR({ pac: 50, end: 50, mon: 50, res: 50, spr: 50, val: 50 });
    expect(ovr).toBe(50); // All equal → OVR = 50
  });

  it("res has highest weight (0.30)", () => {
    const highRes = computeOVR({ pac: 50, end: 50, mon: 50, res: 99, spr: 50, val: 50 });
    const highPac = computeOVR({ pac: 99, end: 50, mon: 50, res: 50, spr: 50, val: 50 });
    expect(highRes).toBeGreaterThan(highPac);
  });
});

describe("getTier", () => {
  it("returns bronze for OVR < 50", () => {
    expect(getTier({ pac: 20, end: 20, mon: 20, res: 20, spr: 20, val: 20, ovr: 20 })).toBe("bronze");
  });

  it("returns argent for OVR 50-64", () => {
    expect(getTier({ pac: 50, end: 50, mon: 50, res: 50, spr: 50, val: 50, ovr: 50 })).toBe("argent");
  });

  it("returns platine for OVR 65-79", () => {
    expect(getTier({ pac: 70, end: 70, mon: 70, res: 70, spr: 70, val: 70, ovr: 70 })).toBe("platine");
  });

  it("returns diamant for OVR 80-89", () => {
    expect(getTier({ pac: 80, end: 80, mon: 80, res: 80, spr: 80, val: 80, ovr: 85 })).toBe("diamant");
  });

  it("returns legende for OVR >= 90", () => {
    expect(getTier({ pac: 95, end: 95, mon: 95, res: 95, spr: 95, val: 95, ovr: 95 })).toBe("legende");
  });

  it("bronze at OVR = 0", () => {
    expect(getTier({ pac: 0, end: 0, mon: 0, res: 0, spr: 0, val: 0, ovr: 0 })).toBe("bronze");
  });

  it("legende at OVR = 99", () => {
    expect(getTier({ pac: 99, end: 99, mon: 99, res: 99, spr: 99, val: 99, ovr: 99 })).toBe("legende");
  });
});
