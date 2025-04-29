/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // For static export
  },
  skipTrailingSlashRedirect: true,
  distDir: 'out',
};
module.exports = nextConfig;
