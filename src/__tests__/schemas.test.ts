import { describe, it, expect } from "vitest";
import {
  createDuelSchema,
  createClubSchema,
  createRaceSchema,
  updateProfileSchema,
  updateRegionSchema,
  leaderboardQuerySchema,
  openPackSchema,
  equipSkinSchema,
  joinTournamentSchema,
  matchmakeSchema,
  showcaseBadgesSchema,
  racesQuerySchema,
  createFantasyLeagueSchema,
  fantasyDraftSchema,
  fantasyTransferSchema,
  fantasyJoinSchema,
} from "@/schemas";

// ——— createDuelSchema ———

describe("createDuelSchema", () => {
  it("accepts valid duel data", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      duel_type: "instant",
      stake: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "not-a-uuid",
      category: "ovr",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects stake below 5", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      stake: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects stake above 100", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "ovr",
      stake: 200,
    });
    expect(result.success).toBe(false);
  });

  it("defaults duel_type to instant", () => {
    const result = createDuelSchema.safeParse({
      opponent_id: "550e8400-e29b-41d4-a716-446655440000",
      category: "pac",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duel_type).toBe("instant");
    }
  });
});

// ——— createClubSchema ———

describe("createClubSchema", () => {
  it("accepts valid club name", () => {
    const result = createClubSchema.safeParse({ name: "Team Alpha" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createClubSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name > 50 chars", () => {
    const result = createClubSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });
});

// ——— createRaceSchema ———

describe("createRaceSchema", () => {
  it("accepts valid race data", () => {
    const result = createRaceSchema.safeParse({
      name: "Course du Mont Ventoux",
      date: "2026-07-14",
      location: "Mont Ventoux",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = createRaceSchema.safeParse({
      name: "Course",
      date: "14/07/2026",
      location: "Paris",
    });
    expect(result.success).toBe(false);
  });

  it("defaults federation to OTHER", () => {
    const result = createRaceSchema.safeParse({
      name: "Course",
      date: "2026-07-14",
      location: "Paris",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.federation).toBe("OTHER");
    }
  });
});

// ——— updateProfileSchema ———

describe("updateProfileSchema", () => {
  it("accepts valid profile data", () => {
    const result = updateProfileSchema.safeParse({
      bio: "Grimpeur passionné",
      favorite_climb: "Alpe d'Huez",
      bike_name: "Pinarello Dogma",
    });
    expect(result.success).toBe(true);
  });

  it("rejects bio > 500 chars", () => {
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ——— updateRegionSchema ———

describe("updateRegionSchema", () => {
  it("accepts valid region", () => {
    const result = updateRegionSchema.safeParse({ region: "Bretagne" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid region", () => {
    const result = updateRegionSchema.safeParse({ region: "Atlantide" });
    expect(result.success).toBe(false);
  });
});

// ——— leaderboardQuerySchema ———

describe("leaderboardQuerySchema", () => {
  it("accepts valid leaderboard query", () => {
    const result = leaderboardQuerySchema.safeParse({
      region: "Bretagne",
      sort: "ovr",
    });
    expect(result.success).toBe(true);
  });

  it("defaults sort to ovr", () => {
    const result = leaderboardQuerySchema.safeParse({ region: "Bretagne" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("ovr");
    }
  });

  it("defaults scope to region", () => {
    const result = leaderboardQuerySchema.safeParse({ region: "Bretagne" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scope).toBe("region");
    }
  });

  it("rejects empty region", () => {
    const result = leaderboardQuerySchema.safeParse({ region: "" });
    expect(result.success).toBe(false);
  });
});

// ——— openPackSchema ———

describe("openPackSchema", () => {
  it("accepts valid pack ID", () => {
    const result = openPackSchema.safeParse({ packId: "bronze" });
    expect(result.success).toBe(true);
  });

  it("rejects empty packId", () => {
    const result = openPackSchema.safeParse({ packId: "" });
    expect(result.success).toBe(false);
  });
});

// ——— matchmakeSchema ———

describe("matchmakeSchema", () => {
  it("accepts valid matchmake data", () => {
    const result = matchmakeSchema.safeParse({ category: "ovr", stake: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects stake above 50", () => {
    const result = matchmakeSchema.safeParse({ category: "ovr", stake: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects stake below 5", () => {
    const result = matchmakeSchema.safeParse({ category: "ovr", stake: 1 });
    expect(result.success).toBe(false);
  });
});

// ——— showcaseBadgesSchema ———

describe("showcaseBadgesSchema", () => {
  it("accepts up to 3 badges", () => {
    const result = showcaseBadgesSchema.safeParse({ badgeIds: ["a", "b", "c"] });
    expect(result.success).toBe(true);
  });

  it("rejects more than 3 badges", () => {
    const result = showcaseBadgesSchema.safeParse({ badgeIds: ["a", "b", "c", "d"] });
    expect(result.success).toBe(false);
  });

  it("accepts empty array", () => {
    const result = showcaseBadgesSchema.safeParse({ badgeIds: [] });
    expect(result.success).toBe(true);
  });
});

// ——— Fantasy schemas ———

describe("createFantasyLeagueSchema", () => {
  it("accepts valid fantasy league data", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "Ma Ligue",
      isPublic: true,
      entryFee: 50,
      maxParticipants: 10,
      durationWeeks: "4",
    });
    expect(result.success).toBe(true);
  });

  it("transforms durationWeeks to number", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "Test",
      durationWeeks: "8",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationWeeks).toBe(8);
    }
  });

  it("rejects name > 50 chars", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects entryFee > 200", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "Test",
      entryFee: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxParticipants < 4", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "Test",
      maxParticipants: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxParticipants > 20", () => {
    const result = createFantasyLeagueSchema.safeParse({
      name: "Test",
      maxParticipants: 25,
    });
    expect(result.success).toBe(false);
  });

  it("defaults isPublic to false", () => {
    const result = createFantasyLeagueSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });

  it("defaults entryFee to 0", () => {
    const result = createFantasyLeagueSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entryFee).toBe(0);
    }
  });
});

describe("fantasyDraftSchema", () => {
  it("accepts valid draft data", () => {
    const result = fantasyDraftSchema.safeParse({
      cyclistId: "550e8400-e29b-41d4-a716-446655440000",
      isCaptain: true,
      isSuperSub: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid cyclistId", () => {
    const result = fantasyDraftSchema.safeParse({
      cyclistId: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults isCaptain to false", () => {
    const result = fantasyDraftSchema.safeParse({
      cyclistId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isCaptain).toBe(false);
    }
  });

  it("defaults isSuperSub to false", () => {
    const result = fantasyDraftSchema.safeParse({
      cyclistId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isSuperSub).toBe(false);
    }
  });
});

describe("fantasyTransferSchema", () => {
  it("accepts valid transfer data", () => {
    const result = fantasyTransferSchema.safeParse({
      droppedCyclistId: "550e8400-e29b-41d4-a716-446655440000",
      pickedCyclistId: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid droppedCyclistId", () => {
    const result = fantasyTransferSchema.safeParse({
      droppedCyclistId: "bad",
      pickedCyclistId: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});

describe("fantasyJoinSchema", () => {
  it("accepts optional inviteCode", () => {
    const result = fantasyJoinSchema.safeParse({ inviteCode: "ABC123" });
    expect(result.success).toBe(true);
  });

  it("accepts empty body", () => {
    const result = fantasyJoinSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects inviteCode > 10 chars", () => {
    const result = fantasyJoinSchema.safeParse({ inviteCode: "a".repeat(11) });
    expect(result.success).toBe(false);
  });
});

// ——— racesQuerySchema ———

describe("racesQuerySchema", () => {
  it("defaults limit to 200", () => {
    const result = racesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(200);
    }
  });

  it("rejects limit > 500", () => {
    const result = racesQuerySchema.safeParse({ limit: 501 });
    expect(result.success).toBe(false);
  });

  it("coerces string limit to number", () => {
    const result = racesQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });
});
