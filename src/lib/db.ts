import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaKey?: string;
};

function getClientGenerationKey() {
  const files = [
    path.join(process.cwd(), "prisma/schema.prisma"),
    path.join(process.cwd(), "src/generated/prisma/client.ts"),
  ];
  return files
    .map((file) => {
      try {
        return fs.statSync(/* turbopackIgnore: true */ file).mtimeMs;
      } catch {
        return 0;
      }
    })
    .join(":");
}

function createClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  let url = dbUrl;
  if (dbUrl.startsWith("file:./") || dbUrl.startsWith("file:prisma/")) {
    const relative = dbUrl.replace(/^file:/, "");
    url = `file:${path.join(/*turbopackIgnore: true*/ process.cwd(), relative)}`;
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  const key = getClientGenerationKey();
  if (globalForPrisma.prisma && globalForPrisma.prismaKey === key) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    globalForPrisma.prisma.$disconnect().catch(() => {});
  }

  const client = createClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaKey = key;
  return client;
}

export const prisma = getPrismaClient();
