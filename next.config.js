/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Generate unique build ID to force cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

module.exports = nextConfig
