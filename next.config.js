/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  allowedDevOrigins: ['192.168.1.130'],
}

module.exports = nextConfig
