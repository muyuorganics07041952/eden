import type { NextConfig } from "next";
import withPWAInit, { runtimeCaching as defaultRuntimeCaching } from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Import custom SW for push notification handlers
  customWorkerSrc: "sw-custom",
  // Fallback page when offline and no cache
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // API routes -- never cache (auth tokens)
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: "NetworkOnly",
      },
      // Supabase API -- never cache
      {
        urlPattern: /^https?:\/\/.*\.supabase\.co\/(?!storage).*/i,
        handler: "NetworkOnly",
      },
      // Plant photos from Supabase Storage -- cache first, 30 day expiry
      {
        urlPattern: /^https?:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-images",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Include all default caching rules
      ...defaultRuntimeCaching,
    ],
  },
});

const nextConfig: NextConfig = {
  // next-pwa uses a webpack plugin; tell Next.js 16 to use Turbopack for dev
  // (PWA features only activate in production builds via `npm run build`)
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
};

export default withPWA(nextConfig);
