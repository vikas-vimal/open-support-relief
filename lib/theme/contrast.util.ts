/**
 * WCAG relative-luminance and contrast maths.
 *
 * Exists so the configured palette can be *checked* rather than eyeballed —
 * every contrast bug in this project so far came from estimating a ratio
 * instead of computing it.
 */

/** WCAG AA minimum for body text. */
export const AA_TEXT = 4.5;
/** WCAG AA minimum for UI components and graphical objects. */
export const AA_NON_TEXT = 3;

function toLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const parsed = hex.replace("#", "");
  const value = Number.parseInt(
    parsed.length === 3
      ? parsed
          .split("")
          .map((c) => c + c)
          .join("")
      : parsed,
    16,
  );

  return (
    0.2126 * toLinear((value >> 16) & 255) +
    0.7152 * toLinear((value >> 8) & 255) +
    0.0722 * toLinear(value & 255)
  );
}

/** Contrast ratio between two hex colours, 1–21. Order-independent. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];

  return (lighter + 0.05) / (darker + 0.05);
}
