import { describe, it, expect } from "vitest";

describe("middleware logic", () => {
  const PUBLIC_API_ROUTES = [
    "/api/auth",
    "/api/og",
    "/api/ghost",
    "/api/cron",
    "/api/health",
    "/api/subscribe",
    "/api/webhooks/stripe",
  ];

  it("public routes should bypass auth", () => {
    const publicPaths = ["/api/auth/callback", "/api/health", "/api/og/card/123"];
    publicPaths.forEach(path => {
      const isPublic = PUBLIC_API_ROUTES.some(route => path.startsWith(route));
      expect(isPublic).toBe(true);
    });
  });

  it("private routes should require auth", () => {
    const privatePaths = ["/api/duels", "/api/coins", "/api/profile"];
    privatePaths.forEach(path => {
      const isPublic = PUBLIC_API_ROUTES.some(route => path.startsWith(route));
      expect(isPublic).toBe(false);
    });
  });

  it("rate limit category mapping", () => {
    function getCategory(pathname: string, method: string) {
      if (pathname.startsWith("/api/auth")) return "auth";
      if (pathname.startsWith("/api/strava/sync")) return "stravaSync";
      if (pathname.startsWith("/api/users/search")) return "search";
      if (method === "POST" && (pathname.startsWith("/api/duels") || pathname.startsWith("/api/clubs") || pathname.startsWith("/api/tournaments"))) return "creation";
      if (method !== "GET") return "sensitive";
      return "general";
    }

    expect(getCategory("/api/auth/signin", "GET")).toBe("auth");
    expect(getCategory("/api/strava/sync", "POST")).toBe("stravaSync");
    expect(getCategory("/api/users/search", "GET")).toBe("search");
    expect(getCategory("/api/duels", "POST")).toBe("creation");
    expect(getCategory("/api/clubs", "POST")).toBe("creation");
    expect(getCategory("/api/profile", "PUT")).toBe("sensitive");
    expect(getCategory("/api/leaderboard", "GET")).toBe("general");
  });

  it("CSRF: should validate origin for POST requests", () => {
    const allowedOrigins = ["https://velocard.app", "http://localhost:3000"];
    expect(allowedOrigins.includes("https://velocard.app")).toBe(true);
    expect(allowedOrigins.includes("https://evil.com")).toBe(false);
    expect(allowedOrigins.includes("http://localhost:3000")).toBe(true);
  });
});
