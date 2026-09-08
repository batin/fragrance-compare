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

export function searchPerfumes(query: string, limit = 30, offset = 0): PerfumeSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.id, p.name, b.name as brand, p.gender, p.release_year, p.rating, p.image_url
       FROM perfumes p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.name LIKE ? OR b.name LIKE ?
       ORDER BY p.rating DESC NULLS LAST, p.name ASC
       LIMIT ? OFFSET ?`,
    )
    .all(`%${query}%`, `%${query}%`, limit, offset) as Parameters<typeof rowToSummary>[0][];

  const accordsByPerfume = getAccordsFor(rows.map((r) => r.id));
  return rows.map((row) => ({ ...rowToSummary(row), accords: accordsByPerfume.get(row.id) ?? [] }));
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

export function getSimilarPerfumes(id: number, limit = 8): PerfumeSummary[] {
  const target = getPerfumeDetail(id);
  if (!target) return [];
  const targetProfile = { notes: Object.values(target.notes).flat(), accords: target.accords };

  const db = getDb();
  const candidateIds = (
    db.prepare(`SELECT id FROM perfumes WHERE id != ?`).all(id) as { id: number }[]
  ).map((r) => r.id);

  const scored = candidateIds
    .map((candidateId) => {
      const candidate = getPerfumeDetail(candidateId);
      if (!candidate) return null;
      const profile = { notes: Object.values(candidate.notes).flat(), accords: candidate.accords };
      return { candidate, score: similarity(targetProfile, profile) };
    })
    .filter((x): x is { candidate: PerfumeDetail; score: number } => x !== null && x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.candidate);
}
