/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  images: {
    // Removed unoptimized: true — Next.js image optimization is now enabled.
    // remotePatterns covers both the production domain and the internal Docker
    // service name used by the image optimizer when fetching uploaded images.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'banquet.bikafood.com',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '**',
      },
      {
        // Docker-internal: the Next.js image optimizer fetches /api/uploads/*
        // from the Express container via this hostname (see rewrites below).
        protocol: 'http',
        hostname: 'server',
        port: '5000',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    // In production Docker, the image optimizer runs inside the Next.js container
    // and cannot reach /api/uploads via Nginx. This rewrite lets it fetch uploaded
    // images directly from the Express container over the Docker bridge network.
    // For local dev outside Docker, set INTERNAL_SERVER_URL=http://localhost:5000
    // in your .env file.
    return [
      {
        source: '/api/uploads/:path*',
        destination: `${process.env.INTERNAL_SERVER_URL || 'http://server:5000'}/api/uploads/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  transpilePackages: ['@ionic/react', '@ionic/core', 'ionicons'],
};

export default nextConfig;
