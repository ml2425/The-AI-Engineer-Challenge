/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only proxy to localhost in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*', // Proxy to FastAPI backend
        },
      ];
    }
    // In production (Vercel), API routes are handled by Vercel's serverless functions
    return [];
  },
}

module.exports = nextConfig

