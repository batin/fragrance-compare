/**
 * Imports the Kaggle "Fragrantica.com Fragrance Dataset" (or a similarly-shaped
 * Fragrantica CSV export) into the local SQLite DB.
 *
 * Usage:
 *   1. Download the dataset (requires a free Kaggle account + API key):
 *        kaggle datasets download olgagmiufana1/fragrantica-com-fragrance-dataset -p data --unzip
 *   2. npm run import-dataset
 *
 * The dataset's exact column names vary by export. This script resolves columns
 * by alias (see COLUMN_ALIASES below) rather than hardcoding one exact schema —
 * if it can't find a column it needs, it prints which CSV/column is missing so
 * you can add the real header name to the alias list.
 */
import { parse } from "csv-parse/sync";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../lib/db";
import { parseListField, resolveColumn } from "./csv-utils";

const DATA_DIR = process.env.DATASET_DIR ?? join(process.cwd(), "data");

const COLUMN_ALIASES = {
  name: ["name", "perfume", "title"],
  brand: ["brand", "brand name"],
  gender: ["gender", "for gender"],
  year: ["year", "release_year", "launch year"],
  rating: ["rating", "rating value", "rating_value"],
  imageUrl: ["image url", "image_url", "main_photo", "photo"],
  url: ["url", "link"],
  perfumers: ["perfumer", "perfumers", "perfumer1", "nose"],
  top: ["top", "top notes", "notes_top"],
  middle: ["middle", "heart", "middle notes", "notes_middle", "heart notes"],
  base: ["base", "base notes", "notes_base"],
  notes: ["notes", "notes_pyramid", "all notes"],
  accords: ["accords", "main accords", "mainaccords"],
};

type Row = Record<string, string>;

function findFragrancesCsv(): string {
  const candidates = readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith(".csv"));
  const preferred = candidates.find((f) => /fragr|perfume/i.test(f)) ?? candidates[0];
  if (!preferred) {
    throw new Error(
      `No CSV files found in ${DATA_DIR}. Download the dataset first (see script header comment).`,
    );
  }
  return join(DATA_DIR, preferred);
}

function loadRows(csvPath: string): Row[] {
  const content = readFileSync(csvPath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as Row[];
}

function main() {
  const csvPath = findFragrancesCsv();
  console.log(`Reading ${csvPath}...`);
  const rows = loadRows(csvPath);
  if (rows.length === 0) throw new Error("CSV has no data rows.");

  const headers = Object.keys(rows[0]);
  const col = Object.fromEntries(
    Object.entries(COLUMN_ALIASES).map(([field, aliases]) => [field, resolveColumn(headers, aliases)]),
  ) as Record<keyof typeof COLUMN_ALIASES, string | undefined>;

  if (!col.name) {
    throw new Error(
      `Could not find a "name" column among: ${headers.join(", ")}. Add the real header to COLUMN_ALIASES.name in this script.`,
    );
  }

  const db = getDb();

  const getOrCreate = (table: "brands" | "perfumers" | "notes" | "accords") => {
    const select = db.prepare(`SELECT id FROM ${table} WHERE name = ?`);
    const insert = db.prepare(`INSERT INTO ${table} (name) VALUES (?)`);
    const cache = new Map<string, number>();
    return (name: string): number => {
      const key = name.trim();
      if (!key) throw new Error(`Empty name passed to getOrCreate(${table})`);
      const cached = cache.get(key);
      if (cached) return cached;
      const existing = select.get(key) as { id: number } | undefined;
      if (existing) {
        cache.set(key, existing.id);
        return existing.id;
      }
      const id = Number(insert.run(key).lastInsertRowid);
      cache.set(key, id);
      return id;
    };
  };

  const getOrCreateBrand = getOrCreate("brands");
  const getOrCreatePerfumer = getOrCreate("perfumers");
  const getOrCreateNote = getOrCreate("notes");
  const getOrCreateAccord = getOrCreate("accords");

  const insertPerfume = db.prepare(
    `INSERT INTO perfumes (name, brand_id, gender, release_year, rating, image_url, url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertPerfumePerfumer = db.prepare(
    `INSERT OR IGNORE INTO perfume_perfumers (perfume_id, perfumer_id) VALUES (?, ?)`,
  );
  const insertPerfumeNote = db.prepare(
    `INSERT OR IGNORE INTO perfume_notes (perfume_id, note_id, position) VALUES (?, ?, ?)`,
  );
  const insertPerfumeAccord = db.prepare(
    `INSERT OR IGNORE INTO perfume_accords (perfume_id, accord_id, strength) VALUES (?, ?, ?)`,
  );

  let imported = 0;

  const importAll = db.transaction((data: Row[]) => {
    for (const row of data) {
      const name = col.name && row[col.name]?.trim();
      if (!name) continue;

      const brandName = col.brand ? row[col.brand]?.trim() : undefined;
      const brandId = brandName ? getOrCreateBrand(brandName) : null;

      const yearRaw = col.year ? row[col.year] : undefined;
      const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;

      const ratingRaw = col.rating ? row[col.rating] : undefined;
      const rating = ratingRaw ? Number.parseFloat(ratingRaw) : null;

      const perfumeId = Number(
        insertPerfume.run(
          name,
          brandId,
          col.gender ? (row[col.gender]?.trim() ?? null) : null,
          Number.isFinite(year) ? year : null,
          Number.isFinite(rating) ? rating : null,
          col.imageUrl ? (row[col.imageUrl]?.trim() ?? null) : null,
          col.url ? (row[col.url]?.trim() ?? null) : null,
        ).lastInsertRowid,
      );

      if (col.perfumers) {
        for (const perfumer of parseListField(row[col.perfumers])) {
          insertPerfumePerfumer.run(perfumeId, getOrCreatePerfumer(perfumer));
        }
      }

      const positioned: Array<[string | undefined, "top" | "middle" | "base"]> = [
        [col.top, "top"],
        [col.middle, "middle"],
        [col.base, "base"],
      ];
      let hasPositionedNotes = false;
      for (const [column, position] of positioned) {
        if (!column) continue;
        for (const note of parseListField(row[column])) {
          hasPositionedNotes = true;
          insertPerfumeNote.run(perfumeId, getOrCreateNote(note), position);
        }
      }
      if (!hasPositionedNotes && col.notes) {
        for (const note of parseListField(row[col.notes])) {
          insertPerfumeNote.run(perfumeId, getOrCreateNote(note), "unspecified");
        }
      }

      if (col.accords) {
        for (const accord of parseListField(row[col.accords])) {
          insertPerfumeAccord.run(perfumeId, getOrCreateAccord(accord), 1);
        }
      }

      imported += 1;
    }
  });

  importAll(rows);

  console.log(`Imported ${imported} perfumes.`);
  for (const table of ["brands", "perfumers", "notes", "accords", "perfumes"] as const) {
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`  ${table}: ${count}`);
  }
}

main();
