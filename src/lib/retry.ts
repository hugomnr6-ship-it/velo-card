// ═══════════════════════════════════════════════
// Retry Logic avec Exponential Backoff + Jitter
// Pour les appels vers des API externes (Strava, Garmin, Wahoo, OpenWeather)
// ═══════════════════════════════════════════════

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    retryOn = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryOn(error)) {
        throw error;
      }

      // Exponential backoff avec jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry prêt à l'emploi pour les appels Strava/Garmin/Wahoo.
 * Ne retry pas les erreurs 4xx sauf 429 (rate limit).
 */
export function withExternalRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelayMs: 2000,
    retryOn: (error: any) => {
      // Ne retry pas les erreurs client (sauf rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return true;
    },
  });
}
