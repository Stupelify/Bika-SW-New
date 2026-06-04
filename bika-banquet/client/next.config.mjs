// CAPACITOR_BUILD=1 produces a static bundle (./out) for the native app to load
// locally (offline-capable, instant start). When unset, the config is identical
// to before: server-mode build for the web deployment. This keeps the live
// website on banquet.bikafood.com completely unaffected.
const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  images: {
    // The Next image optimizer needs a server; a static export can't use it.
    unoptimized: isCapacitorBuild,
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
  experimental: {
    // Per-icon / per-function imports so only used symbols ship to the client.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  transpilePackages: ['@ionic/react', '@ionic/core', 'ionicons'],
  // Emit a static export for the Capacitor bundle.
  ...(isCapacitorBuild ? { output: 'export' } : {}),
  // rewrites() are a server-mode feature (ignored by `output: export`). Keep them
  // only for the web build; the bundled app talks to an absolute API URL instead.
  ...(isCapacitorBuild
    ? {}
    : {
        async rewrites() {
          const backendUrl =
            process.env.INTERNAL_SERVER_URL || process.env.BACKEND_URL || 'http://server:5000';
          return [
            { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
            { source: '/health', destination: `${backendUrl}/health` },
          ];
        },
      }),
};

export default nextConfig;
