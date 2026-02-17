import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

function reportMetric(metric: Metric) {
  // Send to PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }

  // Log in dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value} (${metric.rating})`);
  }
}

export function initWebVitals() {
  onCLS(reportMetric);
  onFID(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
  onINP(reportMetric);
}
