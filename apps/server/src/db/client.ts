import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const packageRoot = path.resolve(
  fileURLToPath(new URL("../../", import.meta.url))
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const envDataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : null;
export const dataDir = envDataDir ?? path.join(repoRoot, "data");
export const uploadsDir = path.join(dataDir, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");

export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);

export async function runMigrations() {
  const migrationsFolder = path.join(packageRoot, "drizzle/migrations");
  await migrate(db, { migrationsFolder });
}
