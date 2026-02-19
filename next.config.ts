import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const config: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent pdfjs-dist from being split into a separate chunk
      // that fails to load on mobile with ChunkLoadError
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure canvas is not required (pdf.js tries to use it in node)
        canvas: false,
      };
    }
    return config;
  },
  // Prevent pdfjs-dist from being externalized during SSR
  serverExternalPackages: [],
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(config);
