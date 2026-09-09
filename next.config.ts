import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The SQLite DB is read at runtime via fs, not statically imported, so Next.js's
  // automatic file tracing won't bundle it into the serverless functions on its own.
  outputFileTracingIncludes: {
    "/**": ["./data/parfumes.db"],
  },
};

export default nextConfig;
