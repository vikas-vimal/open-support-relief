import { describe, expect, it } from "vitest";

import {
  findLikelyDuplicates,
  findSimilarNeeds,
  normalizeItemName,
  scoreNameSimilarity,
} from "./item-match.util";
import { AIRDROP_CATEGORY, URGENCY } from "./airdrop.constants";
import type { NeedSummary } from "./airdrop.types";

function buildNeed(itemName: string, id = itemName): NeedSummary {
  return {
    id,
    itemName,
    unit: "piece",
    category: AIRDROP_CATEGORY.FOOD,
    qtyRequested: 100,
    qtyFulfilled: 0,
    qtyReserved: 0,
    shortfall: 100,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedAt: "2026-07-23T10:00:00.000Z",
  };
}

describe("normalizeItemName", () => {
  it.each([
    ["Raincoats", "raincoat"],
    ["  RAIN-COATS  ", "rain coat"],
    ["Water Bottles (1L)", "water bottle 1l"],
    ["Batteries", "battery"],
    ["Boxes", "box"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeItemName(input)).toBe(expected);
  });

  it("leaves short words alone so 'gas' does not become 'ga'", () => {
    expect(normalizeItemName("gas")).toBe("gas");
  });

  it("protects short acronyms — ORS must not be stemmed to OR", () => {
    expect(normalizeItemName("ORS Sachets")).toBe("ors sachet");
  });

  it("does not strip the final s from a double-s word", () => {
    expect(normalizeItemName("glass")).toBe("glass");
  });
});

describe("hyphen and spacing variants", () => {
  it("treats 'Rain-Coats' and 'raincoats' as the same item", () => {
    expect(scoreNameSimilarity("Rain-Coats", "raincoats")).toBeGreaterThan(0.9);
  });

  it("catches a spaced spelling of a closed compound as a duplicate", () => {
    expect(findLikelyDuplicates("rain coats", [buildNeed("Raincoats")])).toHaveLength(1);
  });
});

describe("scoreNameSimilarity", () => {
  it("scores an exact normalized match as 1, across case and plurality", () => {
    expect(scoreNameSimilarity("raincoat", "Raincoats")).toBe(1);
  });

  it("scores a partial word against a longer name well above the duplicate threshold", () => {
    expect(scoreNameSimilarity("water", "Water Bottles (1L)")).toBeGreaterThan(0.5);
  });

  it("scores an unrelated item at zero", () => {
    expect(scoreNameSimilarity("pizza", "Raincoats")).toBe(0);
  });

  it("returns zero for an empty query rather than matching everything", () => {
    expect(scoreNameSimilarity("   ", "Raincoats")).toBe(0);
  });

  it("ranks an exact match above a mere substring match", () => {
    const exact = scoreNameSimilarity("towel", "Towels");
    const partial = scoreNameSimilarity("towel", "Cotton Towel Rolls");
    expect(exact).toBeGreaterThan(partial);
  });
});

describe("findSimilarNeeds", () => {
  const needs = [
    buildNeed("Raincoats"),
    buildNeed("Water Bottles (1L)"),
    buildNeed("Biscuit Packets"),
  ];

  it("returns nothing for an empty query", () => {
    expect(findSimilarNeeds("   ", needs)).toEqual([]);
  });

  it("returns only matching needs, best first", () => {
    const matches = findSimilarNeeds("water", needs);
    expect(matches).toHaveLength(1);
    expect(matches[0].need.itemName).toBe("Water Bottles (1L)");
  });

  it("finds a plural board entry from a singular query", () => {
    expect(findSimilarNeeds("raincoat", needs)[0].need.itemName).toBe("Raincoats");
  });
});

describe("findLikelyDuplicates", () => {
  it("flags an existing item typed in a different form", () => {
    const duplicates = findLikelyDuplicates("raincoat", [buildNeed("Raincoats")]);
    expect(duplicates).toHaveLength(1);
  });

  it("stays silent for a genuinely new item", () => {
    expect(findLikelyDuplicates("gumboots", [buildNeed("Raincoats")])).toEqual([]);
  });

  it("caps suggestions so the form cannot be pushed off screen", () => {
    const manyMatches = [
      buildNeed("Water Bottles", "a"),
      buildNeed("Water Cans", "b"),
      buildNeed("Water Pouches", "c"),
      buildNeed("Water Jugs", "d"),
      buildNeed("Water Drums", "e"),
    ];
    expect(findLikelyDuplicates("water", manyMatches).length).toBeLessThanOrEqual(3);
  });
});
