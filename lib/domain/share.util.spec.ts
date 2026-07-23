import { describe, expect, it } from "vitest";

import { buildAirdropShareText, buildNeedShareText } from "./share.util";

const BRAND = { brandName: "Airdrops for Cockroaches", tagline: "Save the Country" };

describe("buildNeedShareText", () => {
  it("includes the item, shortfall and the public board URL", () => {
    const { text, url } = buildNeedShareText(
      { itemName: "Raincoats", shortfall: 1200, unit: "piece", ...BRAND },
      "https://airdrops.example",
    );
    expect(text).toContain("Raincoats");
    expect(text).toContain("1.2k"); // compact quantity
    expect(text).toContain("Save the Country");
    expect(url).toBe("https://airdrops.example/");
  });

  it("normalises a trailing slash on the origin to a single board URL", () => {
    const { url } = buildNeedShareText(
      { itemName: "Water", shortfall: 5, unit: "bottle", ...BRAND },
      "https://airdrops.example/",
    );
    expect(url).toBe("https://airdrops.example/");
  });

  it("degrades gracefully when nothing is short", () => {
    const { text } = buildNeedShareText(
      { itemName: "Towels", shortfall: 0, unit: "piece", ...BRAND },
      "https://airdrops.example",
    );
    expect(text).toContain("Help send more");
  });

  it("never emits an address or site name — it has no such input to leak", () => {
    // Regression guard for §7: the only text produced comes from item/qty/brand.
    const { text, url } = buildNeedShareText(
      { itemName: "Raincoats", shortfall: 100, unit: "piece", ...BRAND },
      "https://airdrops.example",
    );
    const blob = `${text} ${url}`.toLowerCase();
    for (const forbidden of ["street", "gate", "address", "phone", "jantar", "delhi"]) {
      expect(blob).not.toContain(forbidden);
    }
  });
});

describe("buildAirdropShareText", () => {
  it("states what was sent, with brand, and points at the board", () => {
    const { text, url } = buildAirdropShareText(
      { itemName: "Raincoats", qty: 20, unit: "piece", ...BRAND },
      "https://airdrops.example",
    );
    expect(text).toContain("20 piece");
    expect(text).toContain("Raincoats");
    expect(text).toContain("Airdrops for Cockroaches");
    expect(url).toBe("https://airdrops.example/");
  });
});
