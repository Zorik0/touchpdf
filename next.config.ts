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
  // Aggressive mode prefetches every asset of each visited page — that
  // multiplies CDN/edge requests per visitor for little benefit on a
  // tool site where most visits touch one or two pages.
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Don't precache the 1.4MB pdf.js worker; it's fetched (and then
  // runtime-cached) only when a PDF tool actually uses it.
  publicExcludes: ["!pdf.worker.min.mjs"],
  workboxOptions: {
    disableDevLogs: true,
    // Precache only the app shell. Per-route page chunks and lazy-loaded
    // library chunks (pdf.js, pdf-lib, jsPDF, …) are excluded — they load
    // (and get runtime-cached) on first use instead of forcing every new
    // visitor to download all ~40 tool pages and PDF engines up front.
    exclude: [
      /\.map$/,
      /static\/chunks\/app\/.+\/(page|layout|route)-[^/]+\.js$/,
      /static\/chunks\/[0-9a-f]+[.-][^/]+\.js$/i,
      /static\/chunks\/\d+[.-][^/]+\.js$/,
    ],
  },
})(config);
