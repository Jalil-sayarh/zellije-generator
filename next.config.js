/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enables static export
  
  // If deploying to a subdirectory like yoursite.com/zellij-generator/
  // Adjust this path to match your actual subdirectory
  basePath: '/zellij-generator',
  assetPrefix: '/zellij-generator/',
  
  // Skip ESLint during build (can still run separately with npm run lint)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

