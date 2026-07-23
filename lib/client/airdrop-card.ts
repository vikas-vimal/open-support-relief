import { appConfig } from "@/config/app.config";
import { formatQuantity } from "@/lib/domain/format.util";

/**
 * Renders a supporter's "I airdropped N" share card as a story-sized PNG.
 *
 * SAFETY (§7): the card draws only what they sent (qty, unit, item) and the
 * brand — never a drop-point address or site name. `AirdropCardInput` has no
 * field that could carry either, and this contract must be kept: a share card is
 * a public image, so anything drawn here is effectively published.
 *
 * Uses a heavy system font stack rather than the web display font — a canvas
 * cannot rely on a webfont having loaded, and the poster look survives on
 * Arial Black / Impact fallbacks.
 */

const WIDTH = 1080;
const HEIGHT = 1920;
const DISPLAY_FONT = `"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif`;

export interface AirdropCardInput {
  qty: number;
  unit: string;
  itemName: string;
}

export async function createAirdropCardFile(
  input: AirdropCardInput,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable on this device");

  drawCard(ctx, input);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Failed to render the airdrop card");
  return new File([blob], "airdrop.png", { type: "image/png" });
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  input: AirdropCardInput,
): void {
  const { light, brand } = appConfig.theme;
  const ink = light.fg;
  const paper = light.headerBg;

  // Poster ground + hard frame.
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 14;
  ctx.strokeRect(44, 44, WIDTH - 88, HEIGHT - 88);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Brand wordmark, top.
  ctx.fillStyle = ink;
  ctx.font = `900 60px ${DISPLAY_FONT}`;
  wrapText(ctx, appConfig.brand.name.toUpperCase(), WIDTH / 2, 230, WIDTH - 220, 74);

  // Parachute crest.
  ctx.font = `220px ${DISPLAY_FONT}`;
  ctx.fillText(appConfig.brand.logoEmoji, WIDTH / 2, 620);

  ctx.fillStyle = ink;
  ctx.font = `700 54px ${DISPLAY_FONT}`;
  ctx.fillText("I AIRDROPPED", WIDTH / 2, 780);

  // Accent slab behind the headline number.
  const slabTop = 840;
  const slabHeight = 360;
  ctx.fillStyle = brand.primary;
  ctx.fillRect(90, slabTop, WIDTH - 180, slabHeight);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.strokeRect(90, slabTop, WIDTH - 180, slabHeight);

  ctx.fillStyle = brand.brandInk;
  ctx.font = `900 260px ${DISPLAY_FONT}`;
  ctx.fillText(formatQuantity(input.qty), WIDTH / 2, slabTop + 262);

  // What was sent.
  ctx.fillStyle = ink;
  ctx.font = `800 62px ${DISPLAY_FONT}`;
  wrapText(
    ctx,
    `${input.unit} of ${input.itemName}`.toUpperCase(),
    WIDTH / 2,
    slabTop + slabHeight + 140,
    WIDTH - 220,
    78,
  );

  // Tagline + board wordmark, bottom.
  ctx.fillStyle = ink;
  ctx.font = `700 48px ${DISPLAY_FONT}`;
  ctx.fillText(appConfig.brand.tagline, WIDTH / 2, HEIGHT - 220);
  ctx.font = `600 40px ${DISPLAY_FONT}`;
  ctx.fillText(appConfig.brand.name, WIDTH / 2, HEIGHT - 150);
}

/** Word-wraps centred text, returning the y just past the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = candidate;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}
