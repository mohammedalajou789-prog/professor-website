import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // headless Chromium for sheet → PDF (Vercel: @sparticuz/chromium)
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingIncludes: { '/api/sheet-pdf/**': ['./node_modules/@sparticuz/chromium/bin/**'] },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ]
  },
}

export default nextConfig
