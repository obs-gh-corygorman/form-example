import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  /* config options here */
};

export default nextConfig;
