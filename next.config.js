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
    
    // Suppress Supabase Realtime warnings
    config.ignoreWarnings = [
      { message: /Critical dependency: the request of a dependency is an expression/ },
      { module: /@supabase\/realtime-js/ }
    ]
    
    return config
  },
  // Disable OpenTelemetry warnings and vendor chunk issues (Next.js 15+)
  serverExternalPackages: [
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/instrumentation',
  ],
}

module.exports = nextConfig
