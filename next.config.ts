import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* LUMEN System Synchronization Core v2.1 */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
