import { describe, it, expect } from "vitest";
import { createDuelSchema, createRaceSchema, updateRegionSchema, leaderboardQuerySchema } from "@/schemas";

describe("createDuelSchema", () => {
  it("validates correct input", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      duel_type: "instant",
      stake: 10,
    });
    expect(result.success).toBe(true);
  });
  it("applies defaults", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "pac",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duel_type).toBe("instant");
      expect(result.data.stake).toBe(10);
    }
  });
  it("rejects invalid category", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "invalid",
      stake: 10,
    });
    expect(result.success).toBe(false);
  });
  it("rejects stake out of range", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      stake: 200,
    });
    expect(result.success).toBe(false);
  });
  it("rejects stake below minimum", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      stake: 2,
    });
    expect(result.success).toBe(false);
  });
  it("rejects non-uuid opponent_id", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "not-a-uuid",
      category: "ovr",
    });
    expect(result.success).toBe(false);
  });
});

describe("createRaceSchema", () => {
  it("validates correct input", () => {
    const result = createRaceSchema.safeParse({
      name: "Course Test",
      date: "2026-03-15",
      location: "Paris",
    });
    expect(result.success).toBe(true);
  });
  it("applies defaults", () => {
    const result = createRaceSchema.safeParse({
      name: "Course Test",
      date: "2026-03-15",
      location: "Paris",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.federation).toBe("OTHER");
      expect(result.data.gender).toBe("MIXTE");
      expect(result.data.description).toBe("");
    }
  });
  it("rejects empty name", () => {
    const result = createRaceSchema.safeParse({
      name: "",
      date: "2026-03-15",
      location: "Paris",
    });
    expect(result.success).toBe(false);
  });
  it("rejects invalid date format", () => {
    const result = createRaceSchema.safeParse({
      name: "Course",
      date: "15/03/2026",
      location: "Paris",
    });
    expect(result.success).toBe(false);
  });
  it("rejects missing location", () => {
    const result = createRaceSchema.safeParse({
      name: "Course",
      date: "2026-03-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateRegionSchema", () => {
  it("accepts valid French region", () => {
    const result = updateRegionSchema.safeParse({ region: "Bretagne" });
    expect(result.success).toBe(true);
  });
  it("rejects invalid region", () => {
    const result = updateRegionSchema.safeParse({ region: "Atlantis" });
    expect(result.success).toBe(false);
  });
});

describe("leaderboardQuerySchema", () => {
  it("validates with defaults", () => {
    const result = leaderboardQuerySchema.safeParse({ region: "Bretagne" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("ovr");
    }
  });
  it("rejects empty region", () => {
    const result = leaderboardQuerySchema.safeParse({ region: "" });
    expect(result.success).toBe(false);
  });
});
