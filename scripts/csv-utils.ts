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
