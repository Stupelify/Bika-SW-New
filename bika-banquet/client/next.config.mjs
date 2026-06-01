/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  images: {
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
        protocol: 'http',
        hostname: 'server',
        port: '5000',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_SERVER_URL || process.env.BACKEND_URL || 'http://server:5000';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ];
  },
  experimental: {
    // Per-icon / per-function imports so only used symbols ship to the client.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  transpilePackages: ['@ionic/react', '@ionic/core', 'ionicons'],
};

export default nextConfig;
