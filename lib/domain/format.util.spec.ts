import { describe, expect, it } from "vitest";

import { formatCompactQuantity, formatQuantity } from "./format.util";

describe("formatQuantity", () => {
  it("uses Indian digit grouping", () => {
    expect(formatQuantity(120_000)).toBe("1,20,000");
  });

  it("never abbreviates — it is what aria-labels and the meter line use", () => {
    expect(formatQuantity(1_500)).toBe("1,500");
  });
});

describe("formatCompactQuantity", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1_000, "1k"],
    [1_200, "1.2k"],
    [1_250, "1.3k"],
    [9_999, "10k"],
    [12_000, "12k"],
    [125_400, "125.4k"],
    [999_999, "1000k"],
    [1_000_000, "1M"],
    [1_250_000, "1.3M"],
  ])("formats %i as %s", (input, expected) => {
    expect(formatCompactQuantity(input)).toBe(expected);
  });

  it("never renders a trailing .0", () => {
    expect(formatCompactQuantity(12_000)).toBe("12k");
    expect(formatCompactQuantity(2_000_000)).toBe("2M");
  });

  it("stays exact below the abbreviation threshold", () => {
    expect(formatCompactQuantity(850)).toBe("850");
  });
});
