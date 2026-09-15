import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: {
    unoptimized: true, // GitHub Pages doesn't support the default Next.js Image Optimization API
  },
  trailingSlash: true,
};

export default nextConfig;
