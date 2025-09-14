// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Amazon
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },

      // Yodi / Shopify
      { protocol: 'https', hostname: 'www.yodibeauty.com' },
      { protocol: 'https', hostname: 'yodibeauty.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },

      // (ajoute ici d’autres marchands si besoin)
    ],
  },
};

export default nextConfig;
