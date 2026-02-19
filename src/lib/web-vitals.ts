import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

export function reportWebVitals() {
  const sendToAnalytics = (metric: { name: string; value: number }) => {
    // PostHog is loaded asynchronously, check if available
    if (typeof window !== "undefined" && (window as Record<string, unknown>).posthog) {
      const posthog = (window as Record<string, unknown>).posthog as { capture: (event: string, props: Record<string, unknown>) => void };
      posthog.capture("web_vital", { name: metric.name, value: metric.value });
    }
  };

  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
