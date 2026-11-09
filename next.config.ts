import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90, 95],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    // Allow uploading real (multi-MB) photos via Server Actions.
    serverActions: { bodySizeLimit: "20mb" },
    // La foto de la tarjeta "viaja" hasta la ficha al entrar (<ViewTransition>).
    viewTransition: true,
  },
};

export default nextConfig;
