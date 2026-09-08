import { describe, expect, it } from "vitest";
import { parseListField, resolveColumn } from "./csv-utils";

describe("resolveColumn", () => {
  it("matches aliases case-insensitively and ignoring separators", () => {
    expect(resolveColumn(["Rating Value", "Brand"], ["rating_value", "rating"])).toBe("Rating Value");
    expect(resolveColumn(["mainaccord1"], ["main-accord-1", "mainAccord1"])).toBe("mainaccord1");
  });

  it("returns undefined when no header matches", () => {
    expect(resolveColumn(["Name"], ["brand", "perfumer"])).toBeUndefined();
  });
});

describe("parseListField", () => {
  it("splits on common delimiters and normalizes casing/whitespace", () => {
    expect(parseListField("Bergamot, Rose | Musk")).toEqual(["bergamot", "rose", "musk"]);
  });

  it("dedupes and drops empty/placeholder entries", () => {
    expect(parseListField("Musk, musk, , n/a, -")).toEqual(["musk"]);
  });

  it("returns an empty array for null/undefined/empty input", () => {
    expect(parseListField(undefined)).toEqual([]);
    expect(parseListField(null)).toEqual([]);
    expect(parseListField("")).toEqual([]);
  });
});
