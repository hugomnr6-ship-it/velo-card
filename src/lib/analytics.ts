"use client";

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: "https://eu.i.posthog.com",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage",
    loaded: () => {
      initialized = true;
    },
  });
}

export function identifyUser(userId: string, traits: Record<string, unknown> = {}) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function trackEvent(name: string, properties: Record<string, unknown> = {}) {
  if (!initialized) return;
  posthog.capture(name, properties);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}
