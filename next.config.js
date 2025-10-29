/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      // Pretty URLs for static marketing pages
      { source: '/cenik', destination: '/cenik.html' },
      { source: '/uklid-domacnosti', destination: '/uklid-domacnosti.html' },
      { source: '/uklid-firem', destination: '/uklid-firem.html' },
      { source: '/airbnb', destination: '/airbnb.html' },
    ];
  },
}

module.exports = nextConfig
