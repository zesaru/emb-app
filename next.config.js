/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "https://*.resend.com",
  ...(isDev
    ? [
        "http://127.0.0.1:54321",
        "http://localhost:54321",
        "ws://127.0.0.1:54321",
        "ws://localhost:54321",
      ]
    : []),
].join(' ');

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content-Security-Policy para prevenir XSS
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src ${connectSrc}; frame-ancestors 'none';`,
          },
          // Strict-Transport-Security para HTTPS (solo en producción)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
