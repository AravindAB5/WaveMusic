import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // SWC transform: deterministic class names (SSR/CSR match) and readable
    // displayName-based classes in development.
    styledComponents: true,
  },
};

export default nextConfig;
