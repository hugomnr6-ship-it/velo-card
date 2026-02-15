import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send 20% of transactions in production (keep free tier usage low)
  tracesSampleRate: 0.2,

  // Only capture errors, not all events
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,

  // Don't send in development
  enabled: process.env.NODE_ENV === "production",

  // Filter noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "AbortError",
  ],
});

// Instrument navigation transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
