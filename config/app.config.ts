/**
 * Single source of truth for branding, major copy and the colour theme.
 *
 * Everything here is read at BUILD time — page metadata, the PWA manifest, and
 * the CSS custom properties are all generated from this object — so editing
 * this file and rebuilding rebrands the whole app, installed PWA included.
 *
 * Colours: change them, then run
 *   npx vitest run lib/theme/contrast.spec.ts
 * That suite fails the build if any pairing drops below WCAG AA. It exists
 * because this palette has already produced four real contrast failures, and a
 * config file makes it easy to introduce a fifth without noticing.
 */

/** Colours that stay fixed across light and dark. */
export interface BrandPalette {
  /** Primary button fill. Pairs with `brandInk` text — must be light. */
  primary: string;
  primaryHover: string;
  /** Text/icon colour used on top of `primary`. */
  brandInk: string;
  /** Progress meter fill. */
  meter: string;
  /** Reserved-quantity band; distinguished from `meter` by hatching, not hue. */
  meterSoft: string;
  /** LIVE badge fill. Pairs with white text — must be dark enough for 4.5:1. */
  live: string;
  /** OFFLINE badge fill. Also white text. */
  offline: string;
  /** URGENT stamp fill. White text. */
  urgent: string;
}

/** Colours that swap between schemes. */
export interface SchemePalette {
  canvas: string;
  surface: string;
  surface2: string;
  fg: string;
  fgMuted: string;
  /**
   * Interactive boundaries — inputs, buttons, chips, the meter track. Must
   * stay >= 3:1 against `surface` (WCAG 1.4.11): with `surface` only 1.09:1
   * against `canvas` in dark, this border is the ONLY thing that makes a text
   * field findable.
   */
  border: string;
  /**
   * Structural boundaries — cards, sheets, the header rule. Free to be subtle
   * because a card is identified by its content, not its outline. This is what
   * keeps dark mode reading as material rather than high-contrast.
   */
  borderStructure: string;
  /** Dividers and dashed empty states. Subtlest of the three. */
  borderSoft: string;
  headerBg: string;
  meterTrack: string;
  shadow: string;
  /** Blue-ish text/border accent. */
  accent: string;
  /** NEEDED stamp text/border. */
  warn: string;
  /** "Fully covered" text/border. */
  success: string;
  /**
   * Red text/border for errors and the "rejected" state. Distinct from
   * `--brand-urgent`, which is a FILL (pairs with white text); using that as
   * text measures 2.67:1 on the dark surface. This one flips per theme.
   */
  danger: string;
  focusRing: string;
}

/**
 * Corner treatment. Sharp by default, matching the party site's poster idiom —
 * a hard 90° corner beside a 2px ink border and a hard offset shadow reads as
 * printed matter, which rounded corners undo.
 *
 * Set both to e.g. "8px" / "999px" to go back to rounded without touching a
 * component.
 */
export interface ShapeTokens {
  /** Cards, buttons, inputs, sheets. */
  radius: string;
  /** Chips and badges — separate so pills can stay pills if wanted. */
  radiusPill: string;
  /**
   * Icon-only buttons (theme toggle, sheet close). Kept round even when
   * everything else is square: a lone glyph in a hard-cornered box reads as a
   * disabled tile, while a circle reads unmistakably as "tap me".
   */
  radiusIcon: string;
}

export interface AppConfig {
  brand: {
    name: string;
    shortName: string;
    logoEmoji: string;
    tagline: string;
    description: string;
  };
  copy: {
    liveLabel: string;
    offlineLabel: string;
    contributeCta: string;
    requestCta: string;
    loadMoreCta: string;
    searchPlaceholder: string;
    itemsShortSuffix: string;
    stillNeededLabel: string;
    footerNote: string;
  };
  shape: ShapeTokens;
  theme: {
    brand: BrandPalette;
    light: SchemePalette;
    dark: SchemePalette;
  };
}

export const appConfig: AppConfig = {
  brand: {
    name: "Airdrops for Cockroaches",
    shortName: "Airdrops",
    logoEmoji: "🪂",
    tagline: "Save the Country",
    description:
      "Live shortage board for protest airdrops. See what is needed right now, order it, mark it sent.",
  },

  copy: {
    liveLabel: "Live",
    offlineLabel: "Offline",
    contributeCta: "Airdrop Some 📦",
    requestCta: "Request an airdrop",
    loadMoreCta: "Load more",
    searchPlaceholder: "Search airdrops…",
    itemsShortSuffix: "items short",
    stillNeededLabel: "Still needed",
    footerNote:
      "Airdrops are ordered by you, through your own delivery app. This board never handles money and never shows who is at the site.",
  },

  shape: {
    radius: "0px",
    radiusPill: "0px",
    radiusIcon: "999px",
  },

  theme: {
    brand: {
      primary: "#6ee7a8", // ink on this = 12.1:1
      primaryHover: "#4ade80",
      brandInk: "#1a1108",
      // Nudged down from the requested #0099ff, which measures 2.9998:1 on
      // white and misses the 3:1 non-text threshold by a hair. This clears
      // both tracks: 3.14:1 on white, 3.32:1 on the dark track.
      // Never put a grey track behind it — that drops it to ~2.4:1.
      meter: "#0095fa",
      meterSoft: "#66c2ff",
      live: "#15803d", // white on this = 5.02:1
      offline: "#57534e", // white on this = 7.0:1
      urgent: "#b3261e", // white on this = 6.54:1
    },

    light: {
      canvas: "#ffffff",
      surface: "#ffffff",
      surface2: "#f5f5f4",
      fg: "#1a1108",
      fgMuted: "#57534e",
      // Light mode keeps the hard black poster rule for both — on white there
      // is no harshness problem to solve.
      border: "#1a1108",
      borderStructure: "#1a1108",
      borderSoft: "#d6d3d1",
      headerBg: "#f4ebd7",
      meterTrack: "#ffffff",
      shadow: "#1a1108",
      accent: "#0074c2",
      warn: "#b45309",
      success: "#15803d",
      danger: "#b3261e", // 6.54:1 on white
      focusRing: "#0074c2",
    },

    dark: {
      canvas: "#12100e",
      // Lighter than canvas on purpose: in dark, card separation comes from
      // this step plus the light border, because a hard offset shadow cannot
      // out-darken a near-black background.
      surface: "#1c1917",
      surface2: "#292524",
      fg: "#f5f5f4",
      fgMuted: "#a8a29e",
      // Was #f5f5f4 — 16:1 against surface, which is what made dark mode read
      // as a high-contrast accessibility theme rather than a dark material one.
      border: "#6b645d", // 3.00:1 — the floor for an identifiable control
      borderStructure: "#44403c", // 1.70:1 — subtle, cards only
      borderSoft: "#292524",
      headerBg: "#2a2320",
      meterTrack: "#3f3f46",
      shadow: "#44403c", // black would be invisible against canvas
      accent: "#66c2ff",
      warn: "#fcd34d",
      success: "#4ade80",
      danger: "#fca5a5", // 9.2:1 on the dark surface
      focusRing: "#66c2ff",
    },
  },
};
