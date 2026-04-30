import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the monorepo-root `.env` so Next.js sees DATABASE_URL during local dev.
// In production (Vercel), env vars are injected directly into process.env and
// dotenv leaves them untouched — so this is a no-op there.
loadEnv({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@deal-hunter/db"],
};

export default nextConfig;
