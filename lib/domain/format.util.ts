/**
 * Number formatting for the board.
 *
 * Two functions on purpose. `formatQuantity` is exact and is what belongs
 * anywhere a person is about to act on the number — the meter's "28 / 150"
 * line, every `aria-label`, the contribute sheet. `formatCompactQuantity`
 * abbreviates and is for the headline shortfall only, where a six-digit value
 * would otherwise blow out the card layout.
 *
 * Never abbreviate inside an accessible name: a screen-reader user must get
 * the same precision a sighted user gets from the meter line.
 */

const THOUSAND = 1_000;
const MILLION = 1_000_000;

/** Indian digit grouping — 1,20,000 rather than 120,000. */
export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("en-IN");
}

/**
 * k/M rather than lakh/crore: protest quantities realistically top out in the
 * low thousands, where "1.2k" is unambiguous to this audience and "1.2L" is
 * read as a litre measure at least as often as a lakh.
 */
export function formatCompactQuantity(quantity: number): string {
  if (quantity < THOUSAND) return formatQuantity(quantity);

  if (quantity < MILLION) {
    return `${trimTrailingZero(quantity / THOUSAND)}k`;
  }

  return `${trimTrailingZero(quantity / MILLION)}M`;
}

/** 12.0 → "12", 1.25 → "1.2". Keeps one decimal without ever showing ".0". */
function trimTrailingZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
