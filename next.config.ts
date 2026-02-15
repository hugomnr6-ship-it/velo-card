import type { NextConfig } from "next";

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

export default nextConfig;
