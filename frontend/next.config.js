/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,

  // Optimize builds
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@solana/wallet-adapter-react",
      "framer-motion",
    ],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize for faster builds
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    // Better caching
    config.cache = {
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
    };

    // Skip type checking during build for faster compilation
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config;
  },

  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
