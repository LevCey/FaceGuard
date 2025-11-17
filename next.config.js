/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'encoding')
    return config
  },
}

module.exports = nextConfig
