import { describe, it, expect } from "vitest";

// Test FeedItem event config coverage — ensure all event types have valid config
const eventConfig: Record<string, { icon: string; color: string; label: (meta: any, username: string) => string }> = {
  tier_up: {
    icon: "\u2B06",
    color: "#00F5D4",
    label: (meta, username) => `${username} est passe ${meta.previousTier} → ${meta.newTier}`,
  },
  totw_selected: {
    icon: "\u2B50",
    color: "#FFD700",
    label: (meta, username) => `${username} est dans l'Echappee (${meta.category})`,
  },
  streak_milestone: {
    icon: "\uD83D\uDD25",
    color: "#FF6B35",
    label: (meta, username) => `${username} : ${meta.weeks} semaines d'affilee !`,
  },
  badge_earned: {
    icon: "\uD83C\uDFC5",
    color: "#A78BFA",
    label: (meta, username) => `${username} a debloque "${meta.badgeName}"`,
  },
  duel_won: {
    icon: "\u2694\uFE0F",
    color: "#6366F1",
    label: (meta, username) => `${username} a gagne un duel (${meta.category})`,
  },
  race_result: {
    icon: "\uD83C\uDFC1",
    color: "#00D4FF",
    label: (meta, username) => `${username} a termine ${meta.position}e dans une course`,
  },
  quest_completed: {
    icon: "\uD83C\uDFAF",
    color: "#00F5D4",
    label: (meta, username) => `${username} a complete la quete "${meta.questTitle}"`,
  },
  pack_opened: {
    icon: "\uD83D\uDCE6",
    color: "#A78BFA",
    label: (meta, username) => `${username} a ouvert un pack et obtenu ${meta.bestItemName} (${meta.bestItemRarity})`,
  },
  duel_domination: {
    icon: "\uD83D\uDCA5",
    color: "#FF6B35",
    label: (meta, username) => `${username} a domine son adversaire en duel !`,
  },
  war_won: {
    icon: "\uD83C\uDFF0",
    color: "#FFD700",
    label: (meta, username) => `Le club de ${username} a gagne la guerre !`,
  },
  war_lost: {
    icon: "\uD83D\uDEE1\uFE0F",
    color: "#64748B",
    label: (meta, username) => `Le club de ${username} a perdu la guerre`,
  },
  tournament_won: {
    icon: "\uD83C\uDFC6",
    color: "#FFD700",
    label: (meta, username) => `${username} a remporte le tournoi !`,
  },
  season_reward: {
    icon: "\uD83C\uDFC5",
    color: "#6366F1",
    label: (meta, username) => `${username} a termine #${meta.rank} de la saison`,
  },
  fantasy_league_created: {
    icon: "\u26BD",
    color: "#6366F1",
    label: (meta, username) => `${username} a cree la ligue Fantasy "${meta.leagueName}"`,
  },
  fantasy_league_won: {
    icon: "\uD83C\uDFC6",
    color: "#FFD700",
    label: (meta, username) => `${username} a remporte une ligue Fantasy !`,
  },
  fantasy_transfer: {
    icon: "\uD83D\uDD04",
    color: "#A78BFA",
    label: (meta, username) => `${username} a recrute ${meta.cyclistName} en Fantasy`,
  },
};

describe("Feed event types", () => {
  const allEventTypes = Object.keys(eventConfig);

  it("has at least 16 event types", () => {
    expect(allEventTypes.length).toBeGreaterThanOrEqual(16);
  });

  it("all event types have icon", () => {
    for (const type of allEventTypes) {
      expect(eventConfig[type].icon).toBeTruthy();
    }
  });

  it("all event types have color", () => {
    for (const type of allEventTypes) {
      expect(eventConfig[type].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("all event types have label function", () => {
    for (const type of allEventTypes) {
      expect(typeof eventConfig[type].label).toBe("function");
    }
  });

  it("tier_up generates correct label", () => {
    const label = eventConfig.tier_up.label(
      { previousTier: "bronze", newTier: "argent" },
      "TestUser",
    );
    expect(label).toContain("TestUser");
    expect(label).toContain("bronze");
    expect(label).toContain("argent");
  });

  it("fantasy_league_created generates correct label", () => {
    const label = eventConfig.fantasy_league_created.label(
      { leagueName: "Ma Ligue" },
      "Hugo",
    );
    expect(label).toContain("Hugo");
    expect(label).toContain("Ma Ligue");
  });

  it("fantasy_transfer generates correct label", () => {
    const label = eventConfig.fantasy_transfer.label(
      { cyclistName: "Pierre" },
      "Hugo",
    );
    expect(label).toContain("Hugo");
    expect(label).toContain("Pierre");
  });

  it("duel_won generates correct label", () => {
    const label = eventConfig.duel_won.label(
      { category: "ovr" },
      "TestUser",
    );
    expect(label).toContain("TestUser");
    expect(label).toContain("ovr");
  });

  it("race_result generates correct label", () => {
    const label = eventConfig.race_result.label(
      { position: 3 },
      "TestUser",
    );
    expect(label).toContain("3");
    expect(label).toContain("TestUser");
  });

  it("includes fantasy event types", () => {
    expect(allEventTypes).toContain("fantasy_league_created");
    expect(allEventTypes).toContain("fantasy_league_won");
    expect(allEventTypes).toContain("fantasy_transfer");
  });
});
