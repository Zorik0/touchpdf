import type { NextConfig } from "next";

/** v1 tools that Organize pages now covers. */
const MERGED_INTO_ORGANIZE = ["/rotate-pdf", "/reverse-pdf", "/blank-pages"];

/** v1 tools that are being rebuilt; their pages point home until they're back. */
const COMING_BACK = [
  "/sign-pdf",
  "/annotate",
  "/redact",
  "/crop-pdf",
  "/view-pdf",
  "/grayscale",
  "/invert",
  "/word-to-pdf",
  "/excel-to-pdf",
  "/ppt-to-pdf",
  "/pdf-to-word",
];

/** v1 tools that v2 doesn't include. */
const RETIRED = [
  "/pdf-to-excel",
  "/md-to-pdf",
  "/batch-convert",
  "/compare-pdf",
  "/compress-image",
  "/qr-code",
  "/print-assistor",
  "/resume-builder",
  "/invoice-generator",
  "/certificate-generator",
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      ...MERGED_INTO_ORGANIZE.map((source) => ({ source, destination: "/organize", permanent: true })),
      { source: "/metadata-editor", destination: "/privacy-clean", permanent: true },
      ...RETIRED.map((source) => ({ source, destination: "/", permanent: true })),
      ...COMING_BACK.map((source) => ({ source, destination: "/", permanent: false })),
    ];
  },
  async headers() {
    return [
      {
        // Browsers must always re-check the service worker script.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default config;
