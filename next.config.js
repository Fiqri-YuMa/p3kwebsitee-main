/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Lewati ESLint saat build
  },
  typescript: {
    ignoreBuildErrors: true, // Lewati TypeScript errors (opsional)
  },
}

module.exports = nextConfig