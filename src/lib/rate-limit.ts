// Simple in-memory rate limiter (Edge Runtime compatible)
// Note: In serverless (Vercel), memory resets on cold start.
// Acceptable for MVP. For persistent rate limiting, use Upstash Redis.

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const LIMITS = { general: 60, sensitive: 10, auth: 5 } as const;

export type RateLimitCategory = keyof typeof LIMITS;

/**
 * Vérifie le rate limit pour une IP et catégorie données.
 * Retourne null si OK, ou une Response 429 si dépassé.
 */
export async function checkRateLimit(
  ip: string,
  category: RateLimitCategory = "general",
): Promise<Response | null> {
  const maxReqs = LIMITS[category];
  const now = Date.now();
  const key = `${category}:${ip}`;

  const entry = requestCounts.get(key);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  entry.count++;
  if (entry.count > maxReqs) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessaie dans un moment." } },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}

/**
 * Extrait l'IP depuis un Request (compatible Vercel).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
