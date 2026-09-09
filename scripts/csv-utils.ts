/** Resolve which of a row's actual CSV headers matches one of the given aliases (case/space-insensitive). */
export function resolveColumn(headers: string[], aliases: string[]): string | undefined {
  const normalized = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const aliasSet = new Set(aliases.map(normalized));
  return headers.find((h) => aliasSet.has(normalized(h)));
}

/** Split a delimited/list-ish field ("bergamot, rose | musk") into trimmed, deduped, lowercase entries. */
export function parseListField(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const parts = raw
    .split(/[,|;]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s !== "n/a" && s !== "-");
  return Array.from(new Set(parts));
}

/** Guess a CSV's field delimiter from its header line (some Fragrantica exports use ';', not ','). */
export function detectDelimiter(headerLine: string): "," | ";" {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Find headers like "mainaccord1", "mainaccord2", ... for a given prefix, sorted by their number. */
export function numberedColumns(headers: string[], prefix: string): string[] {
  const normalizedPrefix = prefix.toLowerCase();
  return headers
    .filter((h) => h.toLowerCase().startsWith(normalizedPrefix) && /\d+$/.test(h))
    .sort((a, b) => Number(a.match(/\d+$/)![0]) - Number(b.match(/\d+$/)![0]));
}

/** Parses a numeric field that may use a European comma decimal separator ("1,42"). */
export function parseDecimal(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Turns a URL-slug-style name ("jean-paul-gaultier") into a readable title ("Jean Paul Gaultier"). */
export function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/**
 * Fragrantica page URLs end in "-<id>.html"; that same id maps to a real product photo
 * on Fragrantica's image CDN, so we can get real images without a dedicated image column.
 */
export function imageUrlFromFragranticaUrl(url: string | undefined | null): string | null {
  const match = url?.match(/-(\d+)\.html$/);
  return match ? `https://fimgs.net/mdimg/perfume/375x500.${match[1]}.jpg` : null;
}
