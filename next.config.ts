import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'uploadthing.com'
          },
          {
              protocol: 'https',
              hostname: 'utfs.io'
          },
          {
              protocol: 'https',
              hostname: 'img.clerk.com'
          },
          {
              protocol: 'https',
              hostname: 'subdomain'
          },
          {
              protocol: 'https',
              hostname: 'files.stripe.com'
          },
          {
              protocol: 'https',
              hostname: 'ufs.sh'
          }
      ]
  },
};

export default nextConfig;
