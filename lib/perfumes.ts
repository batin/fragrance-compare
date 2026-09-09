import { getDb } from "./db";
import { similarity } from "./similarity";

export type PerfumeSummary = {
  id: number;
  name: string;
  brand: string | null;
  gender: string | null;
  releaseYear: number | null;
  rating: number | null;
  imageUrl: string | null;
  accords: string[];
};

export type PerfumeDetail = PerfumeSummary & {
  url: string | null;
  perfumers: string[];
  notes: { top: string[]; middle: string[]; base: string[]; unspecified: string[] };
};

function rowToSummary(row: {
  id: number;
  name: string;
  brand: string | null;
  gender: string | null;
  release_year: number | null;
  rating: number | null;
  image_url: string | null;
}): Omit<PerfumeSummary, "accords"> {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    gender: row.gender,
    releaseYear: row.release_year,
    rating: row.rating,
    imageUrl: row.image_url,
  };
}

function getAccordsFor(perfumeIds: number[]): Map<number, string[]> {
  if (perfumeIds.length === 0) return new Map();
  const db = getDb();
  const placeholders = perfumeIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT pa.perfume_id as perfumeId, a.name as name
       FROM perfume_accords pa JOIN accords a ON a.id = pa.accord_id
       WHERE pa.perfume_id IN (${placeholders})
       ORDER BY pa.strength DESC`,
    )
    .all(...perfumeIds) as { perfumeId: number; name: string }[];

  const map = new Map<number, string[]>();
  for (const row of rows) {
    const list = map.get(row.perfumeId) ?? [];
    list.push(row.name);
    map.set(row.perfumeId, list);
  }
  return map;
}

export type PerfumeFilters = { brand?: string; note?: string; accord?: string };

export function searchPerfumes(
  query: string,
  limit = 30,
  offset = 0,
  filters: PerfumeFilters = {},
): PerfumeSummary[] {
  const db = getDb();
  // Placeholder order must match the SQL text left-to-right: join params first (joins appear
  // before WHERE in the query), then the WHERE-clause params, then LIMIT/OFFSET.
  const joins = ["LEFT JOIN brands b ON b.id = p.brand_id"];
  const joinParams: string[] = [];
  const conditions = ["(p.name LIKE ? OR b.name LIKE ?)"];
  const whereParams: (string | number)[] = [`%${query}%`, `%${query}%`];

  if (filters.brand) {
    conditions.push("b.name = ?");
    whereParams.push(filters.brand);
  }
  if (filters.note) {
    joins.push(
      "JOIN perfume_notes fn ON fn.perfume_id = p.id JOIN notes fnn ON fnn.id = fn.note_id AND fnn.name = ?",
    );
    joinParams.push(filters.note);
  }
  if (filters.accord) {
    joins.push(
      "JOIN perfume_accords fa ON fa.perfume_id = p.id JOIN accords fan ON fan.id = fa.accord_id AND fan.name = ?",
    );
    joinParams.push(filters.accord);
  }

  const rows = db
    .prepare(
      `SELECT DISTINCT p.id, p.name, b.name as brand, p.gender, p.release_year, p.rating, p.image_url
       FROM perfumes p ${joins.join(" ")}
       WHERE ${conditions.join(" AND ")}
       ORDER BY p.rating DESC NULLS LAST, p.name ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...joinParams, ...whereParams, limit, offset) as Parameters<typeof rowToSummary>[0][];

  const accordsByPerfume = getAccordsFor(rows.map((r) => r.id));
  return rows.map((row) => ({ ...rowToSummary(row), accords: accordsByPerfume.get(row.id) ?? [] }));
}

export function searchBrands(query: string, limit = 20, offset = 0): string[] {
  const db = getDb();
  return (
    db
      .prepare(`SELECT name FROM brands WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?`)
      .all(`%${query}%`, limit, offset) as { name: string }[]
  ).map((r) => r.name);
}

export function searchNotes(query: string, limit = 20, offset = 0): string[] {
  const db = getDb();
  return (
    db
      .prepare(`SELECT name FROM notes WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?`)
      .all(`%${query}%`, limit, offset) as { name: string }[]
  ).map((r) => r.name);
}

export function getAllAccordNames(): string[] {
  const db = getDb();
  return (db.prepare(`SELECT name FROM accords ORDER BY name ASC`).all() as { name: string }[]).map(
    (r) => r.name,
  );
}

export function getPerfumeDetail(id: number): PerfumeDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.id, p.name, b.name as brand, p.gender, p.release_year, p.rating, p.image_url, p.url
       FROM perfumes p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = ?`,
    )
    .get(id) as (Parameters<typeof rowToSummary>[0] & { url: string | null }) | undefined;
  if (!row) return null;

  const perfumers = (
    db
      .prepare(
        `SELECT pf.name as name FROM perfume_perfumers pp
         JOIN perfumers pf ON pf.id = pp.perfumer_id
         WHERE pp.perfume_id = ?`,
      )
      .all(id) as { name: string }[]
  ).map((r) => r.name);

  const noteRows = db
    .prepare(
      `SELECT n.name as name, pn.position as position FROM perfume_notes pn
       JOIN notes n ON n.id = pn.note_id
       WHERE pn.perfume_id = ?`,
    )
    .all(id) as { name: string; position: "top" | "middle" | "base" | "unspecified" }[];

  const notes = { top: [] as string[], middle: [] as string[], base: [] as string[], unspecified: [] as string[] };
  for (const n of noteRows) notes[n.position].push(n.name);

  const accords = getAccordsFor([id]).get(id) ?? [];

  return { ...rowToSummary(row), url: row.url, perfumers, notes, accords };
}

/**
 * Every perfume's (notes, accords) sets in two bulk queries, instead of one query per perfume.
 * With ~24k perfumes, scoring similarity via getPerfumeDetail-per-candidate took ~3s/request;
 * this brings it down to two queries + an in-memory scan.
 */
function getAllProfiles(): Map<number, { notes: string[]; accords: string[] }> {
  const db = getDb();
  const profiles = new Map<number, { notes: string[]; accords: string[] }>();
  const ensure = (id: number) => {
    let p = profiles.get(id);
    if (!p) {
      p = { notes: [], accords: [] };
      profiles.set(id, p);
    }
    return p;
  };

  for (const row of db
    .prepare(
      `SELECT pn.perfume_id as perfumeId, n.name as name FROM perfume_notes pn JOIN notes n ON n.id = pn.note_id`,
    )
    .all() as { perfumeId: number; name: string }[]) {
    ensure(row.perfumeId).notes.push(row.name);
  }

  for (const row of db
    .prepare(
      `SELECT pa.perfume_id as perfumeId, a.name as name FROM perfume_accords pa JOIN accords a ON a.id = pa.accord_id`,
    )
    .all() as { perfumeId: number; name: string }[]) {
    ensure(row.perfumeId).accords.push(row.name);
  }

  return profiles;
}

export function getSimilarPerfumes(id: number, limit = 8): PerfumeSummary[] {
  const profiles = getAllProfiles();
  const targetProfile = profiles.get(id);
  if (!targetProfile) return [];

  const topIds = Array.from(profiles.entries())
    .filter(([candidateId]) => candidateId !== id)
    .map(([candidateId, profile]) => ({ candidateId, score: similarity(targetProfile, profile) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.candidateId);

  if (topIds.length === 0) return [];

  const db = getDb();
  const placeholders = topIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT p.id, p.name, b.name as brand, p.gender, p.release_year, p.rating, p.image_url
       FROM perfumes p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id IN (${placeholders})`,
    )
    .all(...topIds) as Parameters<typeof rowToSummary>[0][];

  const accordsByPerfume = getAccordsFor(topIds);
  const byId = new Map(
    rows.map((row) => [row.id, { ...rowToSummary(row), accords: accordsByPerfume.get(row.id) ?? [] }]),
  );
  return topIds.map((tid) => byId.get(tid)).filter((s): s is PerfumeSummary => s !== undefined);
}
