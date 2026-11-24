import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
