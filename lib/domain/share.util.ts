import {
  formatCompactQuantity,
  formatQuantity,
} from "@/lib/domain/format.util";

export interface ShareContent {
  text: string;
  url: string;
}

export interface NeedShareInput {
  itemName: string;
  shortfall: number;
  unit: string;
  brandName: string;
  tagline: string;
}

export interface AirdropShareInput {
  itemName: string;
  qty: number;
  unit: string;
  brandName: string;
  tagline: string;
}

function boardUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/`;
}

/**
 * Share text for a single need — the WhatsApp growth loop.
 *
 * SAFETY (extends §7): this takes only the item name, shortfall, unit and the
 * PUBLIC board origin. It has no drop-point address or site name to leak — the
 * board URL is public and the address stays behind the login-gated reveal. Keep
 * it that way: never thread a `DropPoint` or `Site` field into this function.
 */
export function buildNeedShareText(
  input: NeedShareInput,
  origin: string,
): ShareContent {
  const scarcity =
    input.shortfall > 0
      ? `${formatCompactQuantity(input.shortfall)} ${input.unit} still needed.`
      : `Help send more.`;
  const text =
    `🪂 ${input.itemName} needed at a protest airdrop — ${scarcity} ` +
    `Order it to the drop point and mark it sent.\n\n` +
    `${input.brandName} · ${input.tagline}`;
  return { text, url: boardUrl(origin) };
}

/**
 * Share text a supporter posts after sending — "I sent N item".
 *
 * Same safety contract: brand + what they sent only, never where.
 */
export function buildAirdropShareText(
  input: AirdropShareInput,
  origin: string,
): ShareContent {
  const text =
    `I just airdropped ${formatQuantity(input.qty)} ${input.unit} of ` +
    `${input.itemName} to a protest 🪂\n\n${input.brandName} · ${input.tagline}`;
  return { text, url: boardUrl(origin) };
}
