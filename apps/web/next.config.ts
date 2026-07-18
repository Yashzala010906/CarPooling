import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@carpool/ui', '@carpool/types'],
  output: 'standalone',
};

export default nextConfig;
