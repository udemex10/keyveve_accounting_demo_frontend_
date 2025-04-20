import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allow builds even if you have TS errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // allow builds even if you have ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // any other config you already had…
};

export default nextConfig;
