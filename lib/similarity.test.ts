import { describe, expect, it } from "vitest";
import { similarity } from "./similarity";

describe("similarity", () => {
  it("returns 1 for identical profiles", () => {
    const a = { notes: ["bergamot", "vanilla"], accords: ["woody"] };
    expect(similarity(a, a)).toBe(1);
  });

  it("returns 0 for completely disjoint profiles", () => {
    const a = { notes: ["bergamot"], accords: ["woody"] };
    const b = { notes: ["rose"], accords: ["floral"] };
    expect(similarity(a, b)).toBe(0);
  });

  it("returns 0 when both profiles are empty", () => {
    const a = { notes: [], accords: [] };
    expect(similarity(a, a)).toBe(0);
  });

  it("weights shared accords higher than shared notes", () => {
    const base = { notes: ["bergamot", "vanilla", "musk", "cedar"], accords: ["woody", "sweet"] };
    const sharedNoteOnly = { notes: ["bergamot"], accords: ["citrus"] };
    const sharedAccordOnly = { notes: ["oud"], accords: ["woody"] };

    const noteScore = similarity(base, sharedNoteOnly);
    const accordScore = similarity(base, sharedAccordOnly);

    expect(accordScore).toBeGreaterThan(noteScore);
  });

  it("is symmetric", () => {
    const a = { notes: ["bergamot", "rose"], accords: ["floral"] };
    const b = { notes: ["rose", "musk"], accords: ["floral", "woody"] };
    expect(similarity(a, b)).toBeCloseTo(similarity(b, a));
  });
});
