import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    // v1 had a separate page for each of these; Organize pages does all three.
    return ["/rotate-pdf", "/reverse-pdf", "/blank-pages"].map((source) => ({
      source,
      destination: "/organize",
      permanent: true,
    }));
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
