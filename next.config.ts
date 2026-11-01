import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  compress: true,
  // Used only at build time to read component sources and highlight code.
  serverExternalPackages: ["typescript", "shiki"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        // Registry items are fetched cross-origin by the shadcn CLI and other tools.
        source: "/r/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
