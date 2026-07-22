import { describe, expect, it } from "vitest";

import {
  calculateFillRatio,
  countNeedsByFilter,
  countShortItems,
  filterNeedsByCategory,
  formatRelativeTime,
  isCriticallyShort,
  rankNeeds,
  selectVisibleNeeds,
} from "./needs.util";
import {
  CATEGORY_FILTER_ALL,
  AIRDROP_CATEGORY,
  URGENCY,
} from "./airdrop.constants";
import type { NeedSummary } from "./airdrop.types";

function buildNeed(overrides: Partial<NeedSummary> = {}): NeedSummary {
  const qtyRequested = overrides.qtyRequested ?? 100;
  const qtyFulfilled = overrides.qtyFulfilled ?? 0;
  const qtyReserved = overrides.qtyReserved ?? 0;

  return {
    id: "need_test",
    itemName: "Test Item",
    unit: "piece",
    category: AIRDROP_CATEGORY.FOOD,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedAt: "2026-07-22T10:00:00.000Z",
    ...overrides,
    qtyRequested,
    qtyFulfilled,
    qtyReserved,
    // Always mirror the Postgres generated column, so fixtures cannot drift.
    shortfall:
      overrides.shortfall ??
      Math.max(0, qtyRequested - qtyFulfilled - qtyReserved),
  };
}

describe("rankNeeds", () => {
  it("puts higher urgency first regardless of shortfall", () => {
    const urgentSmallGap = buildNeed({
      id: "urgent",
      urgency: URGENCY.URGENT,
      qtyRequested: 10,
    });
    const normalHugeGap = buildNeed({
      id: "normal",
      urgency: URGENCY.NORMAL,
      qtyRequested: 5_000,
    });

    const ranked = rankNeeds([normalHugeGap, urgentSmallGap]);

    expect(ranked.map((need) => need.id)).toEqual(["urgent", "normal"]);
  });

  it("orders by largest shortfall within the same urgency", () => {
    const small = buildNeed({ id: "small", qtyRequested: 20 });
    const large = buildNeed({ id: "large", qtyRequested: 900 });
    const medium = buildNeed({ id: "medium", qtyRequested: 300 });

    const ranked = rankNeeds([small, large, medium]);

    expect(ranked.map((need) => need.id)).toEqual(["large", "medium", "small"]);
  });

  it("breaks exact ties by name so the list cannot jitter between renders", () => {
    const zebra = buildNeed({ id: "zebra", itemName: "Zebra" });
    const apple = buildNeed({ id: "apple", itemName: "Apple" });

    expect(rankNeeds([zebra, apple]).map((need) => need.id)).toEqual([
      "apple",
      "zebra",
    ]);
    // Same result from the opposite input order — the sort is total, not stable-by-input.
    expect(rankNeeds([apple, zebra]).map((need) => need.id)).toEqual([
      "apple",
      "zebra",
    ]);
  });

  it("does not mutate the input array", () => {
    const needs = [
      buildNeed({ id: "a", qtyRequested: 10 }),
      buildNeed({ id: "b", qtyRequested: 90 }),
    ];

    rankNeeds(needs);

    expect(needs.map((need) => need.id)).toEqual(["a", "b"]);
  });

  it("counts reserved quantity against shortfall, so intent locks demote an item", () => {
    const unreserved = buildNeed({ id: "unreserved", qtyRequested: 100 });
    const heavilyReserved = buildNeed({
      id: "reserved",
      qtyRequested: 100,
      qtyReserved: 80,
    });

    expect(rankNeeds([heavilyReserved, unreserved]).map((n) => n.id)).toEqual([
      "unreserved",
      "reserved",
    ]);
  });
});

describe("filterNeedsByCategory", () => {
  const water = buildNeed({ id: "w", category: AIRDROP_CATEGORY.WATER });
  const food = buildNeed({ id: "f", category: AIRDROP_CATEGORY.FOOD });

  it("returns everything for the ALL sentinel", () => {
    expect(filterNeedsByCategory([water, food], CATEGORY_FILTER_ALL)).toHaveLength(2);
  });

  it("narrows to a single category", () => {
    expect(
      filterNeedsByCategory([water, food], AIRDROP_CATEGORY.WATER),
    ).toEqual([water]);
  });
});

describe("selectVisibleNeeds", () => {
  const raincoats = buildNeed({
    id: "raincoats",
    itemName: "Raincoats",
    category: AIRDROP_CATEGORY.RAIN,
    urgency: URGENCY.URGENT,
    qtyRequested: 50,
  });
  const tarpaulin = buildNeed({
    id: "tarpaulin",
    itemName: "Tarpaulin Sheets",
    category: AIRDROP_CATEGORY.RAIN,
    qtyRequested: 900,
  });
  const water = buildNeed({
    id: "water",
    itemName: "Water Bottles",
    category: AIRDROP_CATEGORY.WATER,
    qtyRequested: 400,
  });
  const all = [raincoats, tarpaulin, water];

  it("ranks by urgency then shortfall when there is no query", () => {
    expect(
      selectVisibleNeeds(all, CATEGORY_FILTER_ALL, "").map((need) => need.id),
    ).toEqual(["raincoats", "tarpaulin", "water"]);
  });

  it("intersects the category filter with the search query", () => {
    // "water" matches the WATER item, but the RAIN filter must exclude it.
    expect(
      selectVisibleNeeds(all, AIRDROP_CATEGORY.RAIN, "water"),
    ).toEqual([]);
  });

  it("searches within the active category rather than escaping it", () => {
    expect(
      selectVisibleNeeds(all, AIRDROP_CATEGORY.RAIN, "raincoat").map((n) => n.id),
    ).toEqual(["raincoats"]);
  });

  it("orders by relevance, not urgency, once a query is present", () => {
    // tarpaulin has a far bigger shortfall, but the query names raincoats.
    expect(
      selectVisibleNeeds(all, CATEGORY_FILTER_ALL, "raincoat")[0].id,
    ).toBe("raincoats");
  });

  it("falls back to urgency ordering when the query is only whitespace", () => {
    expect(
      selectVisibleNeeds(all, CATEGORY_FILTER_ALL, "   ").map((need) => need.id),
    ).toEqual(["raincoats", "tarpaulin", "water"]);
  });
});

describe("calculateFillRatio", () => {
  it("counts reserved quantity as covered", () => {
    const need = buildNeed({
      qtyRequested: 100,
      qtyFulfilled: 30,
      qtyReserved: 20,
    });

    expect(calculateFillRatio(need)).toBeCloseTo(0.5);
  });

  it("clamps oversupply to 1 rather than reporting over 100 percent", () => {
    const need = buildNeed({ qtyRequested: 10, qtyFulfilled: 40 });

    expect(calculateFillRatio(need)).toBe(1);
  });

  it("treats a zero-quantity request as fully covered instead of dividing by zero", () => {
    const need = buildNeed({ qtyRequested: 0 });

    expect(calculateFillRatio(need)).toBe(1);
  });
});

describe("isCriticallyShort", () => {
  it("flags an item below the 20 percent fill threshold", () => {
    expect(
      isCriticallyShort(buildNeed({ qtyRequested: 100, qtyFulfilled: 10 })),
    ).toBe(true);
  });

  it("does not flag an item exactly at the threshold", () => {
    expect(
      isCriticallyShort(buildNeed({ qtyRequested: 100, qtyFulfilled: 20 })),
    ).toBe(false);
  });
});

describe("countShortItems", () => {
  it("ignores fully covered items", () => {
    const needs = [
      buildNeed({ id: "short", qtyRequested: 100 }),
      buildNeed({ id: "covered", qtyRequested: 100, qtyFulfilled: 100 }),
    ];

    expect(countShortItems(needs)).toBe(1);
  });
});

describe("countNeedsByFilter", () => {
  it("counts per category and reports the total under ALL", () => {
    const counts = countNeedsByFilter([
      buildNeed({ category: AIRDROP_CATEGORY.WATER }),
      buildNeed({ category: AIRDROP_CATEGORY.WATER }),
      buildNeed({ category: AIRDROP_CATEGORY.MEDICAL }),
    ]);

    expect(counts[CATEGORY_FILTER_ALL]).toBe(3);
    expect(counts[AIRDROP_CATEGORY.WATER]).toBe(2);
    expect(counts[AIRDROP_CATEGORY.MEDICAL]).toBe(1);
  });

  it("reports zero rather than undefined for categories with no needs", () => {
    const counts = countNeedsByFilter([]);

    expect(counts[AIRDROP_CATEGORY.RAIN]).toBe(0);
    expect(counts[AIRDROP_CATEGORY.SAFETY]).toBe(0);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");

  it.each([
    ["2026-07-22T11:59:30.000Z", "just now"],
    ["2026-07-22T11:59:00.000Z", "1 min ago"],
    ["2026-07-22T11:40:00.000Z", "20 min ago"],
    ["2026-07-22T11:00:00.000Z", "1 hour ago"],
    ["2026-07-22T07:00:00.000Z", "5 hours ago"],
    ["2026-07-21T12:00:00.000Z", "1 day ago"],
    ["2026-07-19T12:00:00.000Z", "3 days ago"],
  ])("formats %s as %s", (timestamp, expected) => {
    expect(formatRelativeTime(timestamp, now)).toBe(expected);
  });
});
