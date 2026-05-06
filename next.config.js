const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },

      {
        protocol: "https",
        hostname: "*.r2.dev",
      },

      // localhost apenas dev
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],

    deviceSizes: [320, 420, 768, 1024, 1200, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
