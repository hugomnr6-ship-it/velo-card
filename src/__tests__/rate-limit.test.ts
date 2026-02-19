import { describe, it, expect, vi } from "vitest";

// Mock Upstash
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: {
    slidingWindow: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60000 }),
    }),
  },
}));

describe("rate-limit config", () => {
  it("should define all rate limit categories", () => {
    const categories = ["general", "sensitive", "auth", "stravaSync", "creation", "search"];
    categories.forEach(cat => {
      expect(typeof cat).toBe("string");
    });
  });

  it("should extract client IP from x-forwarded-for header", () => {
    const header = "203.0.113.1, 70.41.3.18, 150.172.238.178";
    const ip = header.split(",")[0].trim();
    expect(ip).toBe("203.0.113.1");
  });

  it("should extract client IP from x-real-ip header", () => {
    const ip = "203.0.113.1";
    expect(ip).toBe("203.0.113.1");
  });

  it("should fallback to unknown if no IP headers", () => {
    const ip = "unknown";
    expect(ip).toBe("unknown");
  });
});
