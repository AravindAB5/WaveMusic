import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The dev-only "N" badge sits in a screen corner, and every corner holds a
  // control (player buttons bottom-left/right, logo and theme/sort at the
  // top). Hide it; Next's error overlay still appears when something breaks.
  devIndicators: false,
  compiler: {
    // SWC transform: deterministic class names (SSR/CSR match) and readable
    // displayName-based classes in development.
    styledComponents: true,
  },
  images: {
    // iTunes artwork CDN (is1-ssl.mzstatic.com, is2-…, etc.).
    remotePatterns: [{ protocol: 'https', hostname: '*.mzstatic.com', pathname: '/image/thumb/**' }],
  },
};

export default nextConfig;
