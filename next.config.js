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
  transpilePackages: ['openai'],
  serverComponentsExternalPackages: ['openai'],
  async rewrites() {
    return [
      // Pretty URLs for static marketing pages (remaining)
    ];
  },
  webpack: (config, { isServer }) => {
    // Add .mjs to module extensions
    if (!config.resolve.extensions.includes('.mjs')) {
      config.resolve.extensions.unshift('.mjs');
    }
    
    // Ensure proper module resolution for ESM packages
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
