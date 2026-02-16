import { describe, it, expect } from "vitest";
import { computeStats, computeOVR, getTier } from "@/lib/stats";
import type { StravaActivity } from "@/types";

describe("computeStats", () => {
  it("returns all zeros for empty activities", () => {
    const stats = computeStats([]);
    expect(stats.pac).toBe(0);
    expect(stats.end).toBe(0);
    expect(stats.mon).toBe(0);
    expect(stats.res).toBe(0);
    expect(stats.spr).toBe(0);
    expect(stats.val).toBe(0);
    expect(stats.ovr).toBe(0);
  });

  it("computes stats for a typical ride", () => {
    const activities: StravaActivity[] = [{
      id: 1,
      name: "Morning Ride",
      distance: 50000, // 50km
      moving_time: 5400, // 1h30
      elapsed_time: 6000,
      total_elevation_gain: 500,
      average_speed: 9.26, // ~33.3 km/h
      max_speed: 15,
      start_date: "2026-02-10T08:00:00Z",
      type: "Ride",
    }];
    const stats = computeStats(activities);
    expect(stats.pac).toBeGreaterThan(0);
    expect(stats.pac).toBeLessThanOrEqual(99);
    expect(stats.end).toBeGreaterThan(0);
    expect(stats.mon).toBeGreaterThan(0);
    expect(stats.ovr).toBeGreaterThan(0);
  });

  it("caps all stats at 99", () => {
    const activities: StravaActivity[] = [{
      id: 1,
      name: "Super Ride",
      distance: 300000, // 300km
      moving_time: 28800, // 8h
      elapsed_time: 28800,
      total_elevation_gain: 8000,
      average_speed: 12, // 43.2 km/h
      max_speed: 25,
      weighted_average_watts: 400,
      start_date: "2026-02-10T08:00:00Z",
      type: "Ride",
    }];
    const stats = computeStats(activities);
    expect(stats.pac).toBeLessThanOrEqual(99);
    expect(stats.end).toBeLessThanOrEqual(99);
    expect(stats.mon).toBeLessThanOrEqual(99);
    expect(stats.res).toBeLessThanOrEqual(99);
    expect(stats.spr).toBeLessThanOrEqual(99);
    expect(stats.val).toBeLessThanOrEqual(99);
  });

  it("ignores non-Ride activities", () => {
    const activities: StravaActivity[] = [{
      id: 1,
      name: "Run",
      distance: 10000,
      moving_time: 3600,
      elapsed_time: 3600,
      total_elevation_gain: 100,
      average_speed: 2.78,
      max_speed: 4,
      start_date: "2026-02-10T08:00:00Z",
      type: "Run",
    }];
    const stats = computeStats(activities);
    expect(stats.pac).toBe(0);
    expect(stats.end).toBe(0);
    expect(stats.mon).toBe(0);
  });
});

describe("getTier", () => {
  it("returns bronze for low OVR", () => {
    expect(getTier({ pac: 10, end: 10, mon: 10, res: 10, spr: 10, val: 10, ovr: 20 })).toBe("bronze");
  });
  it("returns argent for OVR >= 50", () => {
    expect(getTier({ pac: 50, end: 50, mon: 50, res: 50, spr: 50, val: 50, ovr: 50 })).toBe("argent");
  });
  it("returns platine for OVR >= 65", () => {
    expect(getTier({ pac: 65, end: 65, mon: 65, res: 65, spr: 65, val: 65, ovr: 65 })).toBe("platine");
  });
  it("returns diamant for OVR >= 80", () => {
    expect(getTier({ pac: 80, end: 80, mon: 80, res: 80, spr: 80, val: 80, ovr: 80 })).toBe("diamant");
  });
  it("returns legende for OVR >= 90", () => {
    expect(getTier({ pac: 90, end: 90, mon: 90, res: 90, spr: 90, val: 90, ovr: 90 })).toBe("legende");
  });
  it("returns bronze for OVR 49", () => {
    expect(getTier({ pac: 49, end: 49, mon: 49, res: 49, spr: 49, val: 49, ovr: 49 })).toBe("bronze");
  });
});

describe("computeOVR", () => {
  it("computes weighted average correctly", () => {
    const ovr = computeOVR({ pac: 50, end: 50, mon: 50, res: 50, spr: 50, val: 50 });
    expect(ovr).toBe(50);
  });
  it("weights RES highest (0.30)", () => {
    const highRes = computeOVR({ pac: 50, end: 50, mon: 50, res: 99, spr: 50, val: 50 });
    const highPac = computeOVR({ pac: 99, end: 50, mon: 50, res: 50, spr: 50, val: 50 });
    expect(highRes).toBeGreaterThan(highPac);
  });
  it("returns 0 when all stats are 0", () => {
    expect(computeOVR({ pac: 0, end: 0, mon: 0, res: 0, spr: 0, val: 0 })).toBe(0);
  });
});
