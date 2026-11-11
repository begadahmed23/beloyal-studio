import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sharp loads libvips dynamically; include its native files in Wallet functions.
  outputFileTracingIncludes: {
    "/api/wallet/**": ["./node_modules/@img/**/*", "./node_modules/sharp/**/*", "./lib/wallet/fonts/**/*"],
  },
};

export default nextConfig;
