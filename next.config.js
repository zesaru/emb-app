/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are stable in Next.js 14+
  webpack: (config, { isServer }) => {
    // Ignore canvas and supports-color for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        'supports-color': false,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
