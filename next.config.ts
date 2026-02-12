import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dgalywyr863hv.cloudfront.net", // Strava avatar CDN
      },
    ],
  },
};

export default nextConfig;
