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
      // Joom 
      { protocol: 'https', hostname: 'www.joom.com' },
      { protocol: 'https', hostname: 'img.joomcdn.ne' },
      
      // (ajoute ici d’autres marchands si besoin)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.laroche-posay.fr", pathname: "/**" },
      { protocol: "https", hostname: "laroche-posay.fr",       pathname: "/**" },
    ],
  },
};

export default nextConfig;
