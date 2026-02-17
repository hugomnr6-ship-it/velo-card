import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.1.31:3000"],

  // Ignore ESLint errors during build (lint via `next lint` in CI instead)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build (type-check via `tsc` in CI instead)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 1. Optimisation des imports de packages lourds
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "lucide-react",
      "@heroicons/react",
      "date-fns",
    ],
  },

  // 2. Compression activée
  compress: true,

  // 3. Optimisation images avec next/image
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dgalywyr863hv.cloudfront.net" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.strava.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 4. Headers de cache pour les assets statiques + sécurité
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://dgalywyr863hv.cloudfront.net https://*.supabase.co https://connect.garmin.com https://*.cartocdn.com https://*.basemaps.cartocdn.com",
              "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://*.sentry.io wss://*.supabase.co https://basemaps.cartocdn.com https://*.cartocdn.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Cache immutable pour les assets statiques
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/leaderboard",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
      {
        source: "/api/seasons",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=1200" },
        ],
      },
    ];
  },

  // 5. Webpack optimizations — framer-motion est déjà optimisé via optimizePackageImports
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(withBundleAnalyzer(withSentryConfig(nextConfig, {
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
})));
