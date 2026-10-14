import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public clone: allow only localhost for normal local development.
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
