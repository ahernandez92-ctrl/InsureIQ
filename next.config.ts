import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;