import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════
// Cache Layer Redis — Cache-Aside Pattern
// Données chaudes en cache Upstash, fallback DB
// ═══════════════════════════════════════════════

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type CacheOptions = {
  ttl: number; // Durée en secondes
  prefix?: string;
};

/**
 * Cache-aside pattern : cherche en cache d'abord, sinon exécute la fonction et cache le résultat.
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;

  try {
    // 1. Cherche en cache
    const cachedValue = await redis.get<T>(cacheKey);
    if (cachedValue !== null && cachedValue !== undefined) {
      return cachedValue;
    }
  } catch (e) {
    // Si Redis est down, on continue sans cache
    logger.warn("[Cache] Redis read failed", { error: String(e) });
  }

  // 2. Exécute la fonction
  const result = await fn();

  // 3. Met en cache (fire-and-forget)
  try {
    await redis.set(cacheKey, JSON.stringify(result), { ex: options.ttl });
  } catch (e) {
    logger.warn("[Cache] Redis write failed", { error: String(e) });
  }

  return result;
}

/**
 * Invalide une clé ou un pattern de cache.
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (pattern.includes("*")) {
      // Scan et supprime les clés correspondant au pattern
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch (e) {
    logger.warn("[Cache] Invalidation failed", { error: String(e) });
  }
}

/**
 * Invalide le cache d'un utilisateur spécifique.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    invalidateCache(`profile:${userId}`),
    invalidateCache(`stats:${userId}`),
    invalidateCache("leaderboard:*"),
  ]);
}

export { redis };
