#!/usr/bin/env node
/*
 * Generates the PWA icon set from config/app.config.ts colours.
 *
 * The parachute is drawn as vector paths rather than rendered from the 🪂
 * emoji: emoji rasterisation depends on an emoji font being installed, and on
 * a bare CI box it silently produces an empty square or tofu. A drawn glyph is
 * deterministic everywhere.
 *
 * Run:  node scripts/generate-icons.mjs
 * Output is committed, so a normal build needs neither sharp nor this script.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");

// Mirrors config/app.config.ts. Kept literal so this script has no TS build step.
const CANOPY = "#0095fa";
const CANOPY_DARK = "#0074c2";
const CORD = "#1a1108";
const CRATE = "#6ee7a8";
const BACKDROP = "#f4ebd7";

/**
 * @param {number} size
 * @param {boolean} maskable Maskable icons need their art inside the safe zone
 *   (the centre 80%), or Android's circular mask clips the canopy edges.
 */
function parachuteSvg(size, maskable) {
  const inset = maskable ? size * 0.18 : size * 0.08;
  const s = size - inset * 2;
  const x = (v) => inset + v * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKDROP}"/>
  <path d="M ${x(0.08)} ${x(0.42)} A ${s * 0.42} ${s * 0.42} 0 0 1 ${x(0.92)} ${x(0.42)} Z" fill="${CANOPY}"/>
  <path d="M ${x(0.36)} ${x(0.42)} A ${s * 0.16} ${s * 0.42} 0 0 1 ${x(0.64)} ${x(0.42)} Z" fill="${CANOPY_DARK}"/>
  <g stroke="${CORD}" stroke-width="${s * 0.035}" stroke-linecap="round" fill="none">
    <path d="M ${x(0.08)} ${x(0.42)} L ${x(0.44)} ${x(0.68)}"/>
    <path d="M ${x(0.92)} ${x(0.42)} L ${x(0.56)} ${x(0.68)}"/>
    <path d="M ${x(0.36)} ${x(0.43)} L ${x(0.47)} ${x(0.68)}"/>
    <path d="M ${x(0.64)} ${x(0.43)} L ${x(0.53)} ${x(0.68)}"/>
  </g>
  <rect x="${x(0.38)}" y="${x(0.68)}" width="${s * 0.24}" height="${s * 0.2}"
        rx="${s * 0.03}" fill="${CRATE}" stroke="${CORD}" stroke-width="${s * 0.035}"/>
</svg>`;
}

const TARGETS = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

await mkdir(PUBLIC_DIR, { recursive: true });

for (const { file, size, maskable } of TARGETS) {
  const png = await sharp(Buffer.from(parachuteSvg(size, maskable)))
    .png()
    .toBuffer();
  await writeFile(path.join(PUBLIC_DIR, file), png);
  process.stdout.write(`wrote public/${file} (${size}x${size})\n`);
}
