/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',  // Export as static HTML
  images: {
    unoptimized: true, // For static export
  },
  skipTrailingSlashRedirect: true,
  distDir: 'out',
};
module.exports = nextConfig;
