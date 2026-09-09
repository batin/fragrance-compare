import { describe, expect, it } from "vitest";
import {
  detectDelimiter,
  numberedColumns,
  parseDecimal,
  parseListField,
  resolveColumn,
  titleCaseSlug,
} from "./csv-utils";

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

describe("detectDelimiter", () => {
  it("picks semicolon when it outnumbers commas in the header line", () => {
    expect(detectDelimiter("url;Perfume;Brand;Gender")).toBe(";");
  });

  it("picks comma by default", () => {
    expect(detectDelimiter("Name,Brand,Gender")).toBe(",");
  });
});

describe("numberedColumns", () => {
  it("finds and sorts numbered columns matching a prefix", () => {
    expect(numberedColumns(["mainaccord2", "mainaccord1", "url", "mainaccord3"], "mainaccord")).toEqual([
      "mainaccord1",
      "mainaccord2",
      "mainaccord3",
    ]);
  });

  it("returns an empty array when none match", () => {
    expect(numberedColumns(["Name", "Brand"], "perfumer")).toEqual([]);
  });
});

describe("parseDecimal", () => {
  it("parses European comma decimals", () => {
    expect(parseDecimal("1,42")).toBeCloseTo(1.42);
  });

  it("parses plain dot decimals", () => {
    expect(parseDecimal("4.3")).toBeCloseTo(4.3);
  });

  it("returns null for empty/invalid input", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
    expect(parseDecimal("n/a")).toBeNull();
  });
});

describe("titleCaseSlug", () => {
  it("turns a hyphenated slug into a readable title", () => {
    expect(titleCaseSlug("bleu-de-chanel")).toBe("Bleu De Chanel");
    expect(titleCaseSlug("jean-paul-gaultier")).toBe("Jean Paul Gaultier");
  });

  it("leaves already-readable names alone", () => {
    expect(titleCaseSlug("Aventus")).toBe("Aventus");
  });

  it("capitalizes single lowercase words with no hyphen", () => {
    expect(titleCaseSlug("chanel")).toBe("Chanel");
  });
});
