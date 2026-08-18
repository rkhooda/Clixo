import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    // Both are barrel files; without this every icon and every RainbowKit
    // export gets pulled into the chunk that imports one of them.
    optimizePackageImports: ["lucide-react", "@rainbow-me/rainbowkit"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
    ],
  },
};

export default nextConfig;
