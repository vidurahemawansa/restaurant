import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules only — libsql is pure JS and must be bundled for Turbopack dev
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
