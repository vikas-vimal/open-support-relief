import { describe, expect, it } from "vitest";

import type { SchemePalette } from "@/config/app.config";
import { appConfig } from "@/config/app.config";
import { AA_NON_TEXT, AA_TEXT, contrastRatio } from "./contrast.util";
import { buildThemeCss, THEME_ATTRIBUTE } from "./theme-css";

/**
 * Guards the configured palette.
 *
 * `app.config.ts` invites people to change colours, and a wrong colour here is
 * invisible until someone cannot read the board. Every pairing below has
 * already failed at least once during development, so these are regressions,
 * not hypotheticals.
 */

const { brand, light, dark } = appConfig.theme;
const WHITE = "#ffffff";

function textPairs(palette: SchemePalette): [string, string, string][] {
  return [
    ["body text on canvas", palette.fg, palette.canvas],
    ["body text on surface", palette.fg, palette.surface],
    ["muted text on surface", palette.fgMuted, palette.surface],
    ["muted text on canvas", palette.fgMuted, palette.canvas],
    ["header text", palette.fg, palette.headerBg],
    ["accent text on surface", palette.accent, palette.surface],
    ["warn (NEEDED stamp) on surface", palette.warn, palette.surface],
    ["success (covered) on surface", palette.success, palette.surface],
    ["danger (error/rejected) on surface", palette.danger, palette.surface],
  ];
}

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s scheme", (_schemeName, palette) => {
  it.each(textPairs(palette))(
    "%s meets AA for text",
    (_label, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    },
  );

  it("meter fill is distinguishable from its track", () => {
    // The failure this catches: #0099ff on a grey track is 2.39:1 and the fill
    // level becomes unreadable. It only clears 3:1 against white.
    expect(
      contrastRatio(brand.meter, palette.meterTrack),
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("focus ring is visible against the canvas", () => {
    expect(contrastRatio(palette.focusRing, palette.canvas)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
  });

  it("interactive border keeps controls identifiable (WCAG 1.4.11)", () => {
    /*
     * This is the one that must not be softened for looks. `surface` sits only
     * ~1.09:1 against `canvas` in dark, so this border is the sole thing that
     * makes a text input findable. Drop it below 3:1 and the search box
     * effectively disappears.
     */
    expect(contrastRatio(palette.border, palette.surface)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
    expect(contrastRatio(palette.border, palette.canvas)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
  });

  it("structural border is visible but softer than the interactive one", () => {
    const structural = contrastRatio(palette.borderStructure, palette.surface);

    // Visible at all — a card outline that vanishes is not a card outline.
    expect(structural).toBeGreaterThan(1.2);
    // Never *stronger* than the control border, or the hierarchy inverts and
    // decorative card edges shout louder than the inputs.
    expect(structural).toBeLessThanOrEqual(
      contrastRatio(palette.border, palette.surface),
    );
  });
});

describe("brand colours (fixed across both schemes)", () => {
  it("primary button text is readable on the fill", () => {
    // White on this green is 1.74:1 — the fill must pair with brandInk.
    expect(contrastRatio(brand.brandInk, brand.primary)).toBeGreaterThanOrEqual(
      AA_TEXT,
    );
    expect(
      contrastRatio(brand.brandInk, brand.primaryHover),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each([
    ["live badge", "live"],
    ["offline badge", "offline"],
    ["urgent stamp", "urgent"],
  ] as const)("%s carries white text", (_label, key) => {
    // live cannot reuse the button green: #16a34a only reaches 3.30:1.
    expect(contrastRatio(WHITE, brand[key])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("live and offline badges are not visually interchangeable", () => {
    expect(contrastRatio(brand.live, brand.offline)).toBeGreaterThan(1.2);
  });
});

describe("buildThemeCss", () => {
  it("emits the explicit dark override AFTER the media query", () => {
    // Identical specificity (0,2,0) means source order is the only tie-breaker.
    // If this inverts, choosing dark on a light device silently does nothing.
    const css = buildThemeCss();
    const mediaIndex = css.indexOf("@media (prefers-color-scheme:dark)");
    const overrideIndex = css.indexOf(`:root[${THEME_ATTRIBUTE}="dark"]`);

    expect(mediaIndex).toBeGreaterThan(-1);
    expect(overrideIndex).toBeGreaterThan(mediaIndex);
  });

  it("exempts an explicit light choice from the dark media query", () => {
    expect(buildThemeCss()).toContain(`:root:not([${THEME_ATTRIBUTE}="light"])`);
  });

  it("carries every configured colour into the output", () => {
    const css = buildThemeCss();
    expect(css).toContain(light.canvas);
    expect(css).toContain(dark.canvas);
    expect(css).toContain(brand.primary);
    expect(css).toContain(brand.meter);
  });
});
