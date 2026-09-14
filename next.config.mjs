import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  turbopack: {
    root: path.resolve(__dirname)
  },
  // Suppress source maps in production for faster Vercel builds
  productionBrowserSourceMaps: false,
  // Optimize for Vercel Edge Functions
  experimental: {
    optimizeCss: true,
  }
};

export default nextConfig;
