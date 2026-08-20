/**
 * Apply Prisma migrations to a remote Turso database.
 * Usage:
 *   npm run db:migrate:turso          # apply pending migrations
 *   npm run db:migrate:turso -- --fresh  # wipe and re-apply all
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma/migrations");
const fresh = process.argv.includes("--fresh");

async function dropAllTables(client: ReturnType<typeof createClient>) {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  if (tables.rows.length === 0) return;

  await client.execute("PRAGMA foreign_keys=OFF");
  for (const row of tables.rows) {
    const name = row.name as string;
    await client.execute(`DROP TABLE IF EXISTS "${name}"`);
  }
  await client.execute("PRAGMA foreign_keys=ON");
  console.log("Dropped all existing tables.");
}

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url?.startsWith("libsql://") && !url?.startsWith("https://")) {
    throw new Error("DATABASE_URL must be a Turso libsql URL");
  }
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required");
  }

  const client = createClient({ url, authToken });

  if (fresh) {
    await dropAllTables(client);
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id                    TEXT PRIMARY KEY NOT NULL,
      checksum              TEXT NOT NULL,
      finished_at           DATETIME,
      migration_name        TEXT NOT NULL,
      logs                  TEXT,
      rolled_back_at        DATETIME,
      started_at            DATETIME NOT NULL DEFAULT current_timestamp,
      applied_steps_count   INTEGER NOT NULL DEFAULT 0
    )
  `);

  const applied = await client.execute(
    'SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL'
  );
  const appliedNames = new Set(
    applied.rows.map((row) => row.migration_name as string)
  );

  const folders = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();

  for (const folder of folders) {
    if (!fresh && appliedNames.has(folder)) {
      console.log(`skip  ${folder}`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, folder, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;

    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`apply ${folder}`);

    await client.executeMultiple(sql);

    if (!appliedNames.has(folder)) {
      await client.execute({
        sql: `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
              VALUES (?, ?, ?, datetime('now'), ?)`,
        args: [crypto.randomUUID(), "manual", folder, 1],
      });
    }
  }

  console.log("Done — all migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
