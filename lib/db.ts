import Database from "better-sqlite3";
import { join } from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "parfumes.db");

let db: Database.Database | null = null;

/**
 * The app only ever reads at runtime (all writes happen in scripts/import-dataset.ts,
 * which opens its own writable connection). Opening readonly also means this works on
 * read-only deployment filesystems (e.g. Vercel), where creating/writing a file next to
 * the bundled code would fail.
 */
export function getDb(): Database.Database {
  if (db) return db;

  try {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  } catch (cause) {
    throw new Error(
      `Database not found at ${DB_PATH}. Run \`npm run import-dataset\` first (see README).`,
      { cause },
    );
  }
  db.pragma("foreign_keys = ON");

  return db;
}
