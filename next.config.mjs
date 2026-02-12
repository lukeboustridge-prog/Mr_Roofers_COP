/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression is enabled by default in Next.js
  compress: true,

  // Don't generate source maps in production (smaller bundles)
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Optimized device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 301 redirects: legacy routes → encyclopedia
  async redirects() {
    return [
      // COP Reader → Encyclopedia
      {
        source: '/cop',
        destination: '/encyclopedia/cop',
        permanent: true,
      },
      {
        source: '/cop/:chapterNumber',
        destination: '/encyclopedia/cop/:chapterNumber',
        permanent: true,
      },
      // HTG Guides → Encyclopedia (content merged into articles)
      {
        source: '/guides',
        destination: '/encyclopedia/cop',
        permanent: true,
      },
      {
        source: '/guides/:path*',
        destination: '/encyclopedia/cop',
        permanent: true,
      },
    ];
  },

  // Cache headers for static assets
  async headers() {
    return [
      {
        // Cache static assets for 1 year (immutable)
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache JS/CSS chunks for 1 year (they have content hashes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache 3D models for 1 week
        source: '/:all*.glb',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Enable experimental features for better performance
  experimental: {
    // Tree-shake these packages for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'cmdk',
      'sonner',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
    // Include COP chapter JSON files in serverless function bundles
    // (public/ files are served via CDN but not available to fs.readFileSync on Vercel)
    outputFileTracingIncludes: {
      '/cop': ['./public/cop/**'],
      '/cop/[chapterNumber]': ['./public/cop/**'],
      '/encyclopedia/cop': ['./public/cop/**'],
      '/encyclopedia/cop/[chapter]': ['./public/cop/**'],
    },
  },
};

export default nextConfig;
