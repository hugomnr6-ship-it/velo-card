import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.1.31:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dgalywyr863hv.cloudfront.net", // Strava avatar CDN
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry build options
  silent: true,

  // Only upload source maps in production with a DSN
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Tunnel Sentry requests through the app to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Tree-shake debug logging in production
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: false,
  },

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
