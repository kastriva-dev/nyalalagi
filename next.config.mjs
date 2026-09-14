/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  turbopack: {
    root: "."
  },
  // Suppress source maps in production for faster Vercel builds
  productionBrowserSourceMaps: false,
  // Optimize for Vercel Edge Functions
  experimental: {
    optimizeCss: true,
  }
};

export default nextConfig;
