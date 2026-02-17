import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ═══════════════════════════════════════════════
// Rate Limiting distribué avec Upstash Redis
// Persiste entre cold starts Vercel (vs Map() en mémoire)
// ═══════════════════════════════════════════════

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters par type d'endpoint
export const rateLimiters = {
  // Endpoints généraux : 60 requêtes par minute
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "rl:general",
  }),

  // Endpoints sensibles (sync, mutations) : 10 requêtes par minute
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "rl:sensitive",
  }),

  // Auth : 5 requêtes par minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "rl:auth",
  }),

  // Strava sync : 3 par heure (API Strava a des quotas stricts)
  stravaSync: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
    prefix: "rl:strava",
  }),

  // Création de contenu (duels, clubs) : 20 par heure
  creation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
    prefix: "rl:creation",
  }),

  // Search / scraping protection : 30 par minute
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "rl:search",
  }),
};

export type RateLimitCategory = keyof typeof rateLimiters;

/**
 * Applique le rate limit et retourne le résultat + headers.
 */
export async function applyRateLimit(
  identifier: string,
  type: RateLimitCategory = "general"
) {
  const limiter = rateLimiters[type];
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };

  return { success, headers };
}

/**
 * Extrait l'IP depuis un Request (compatible Vercel).
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (forwarded) return forwarded;
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
