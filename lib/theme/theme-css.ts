import type { BrandPalette, SchemePalette } from "@/config/app.config";
import { appConfig } from "@/config/app.config";

/**
 * Generates the CSS custom properties for the whole app from `app.config.ts`.
 *
 * Injected into the document head by the root layout, which is statically
 * prerendered — so this runs at build time and ships as plain CSS. Tailwind's
 * `@theme inline` block in globals.css maps utilities onto these variables, so
 * `bg-surface` / `text-fg` resolve to whatever config says.
 */

export const THEME_ATTRIBUTE = "data-theme";
export const THEME_STORAGE_KEY = "airdrops:theme";

export type ThemeChoice = "light" | "dark" | "system";

function schemeVariables(palette: SchemePalette): string {
  return [
    `--canvas:${palette.canvas}`,
    `--surface:${palette.surface}`,
    `--surface-2:${palette.surface2}`,
    `--fg:${palette.fg}`,
    `--fg-muted:${palette.fgMuted}`,
    `--border:${palette.border}`,
    `--border-structure:${palette.borderStructure}`,
    `--border-soft:${palette.borderSoft}`,
    `--header-bg:${palette.headerBg}`,
    `--meter-track:${palette.meterTrack}`,
    `--shadow-color:${palette.shadow}`,
    `--accent:${palette.accent}`,
    `--warn:${palette.warn}`,
    `--success:${palette.success}`,
    `--danger:${palette.danger}`,
    `--focus-ring:${palette.focusRing}`,
  ].join(";");
}

function brandVariables(palette: BrandPalette): string {
  return [
    `--brand-primary:${palette.primary}`,
    `--brand-primary-hover:${palette.primaryHover}`,
    `--brand-ink:${palette.brandInk}`,
    `--brand-meter:${palette.meter}`,
    `--brand-meter-soft:${palette.meterSoft}`,
    `--brand-live:${palette.live}`,
    `--brand-offline:${palette.offline}`,
    `--brand-urgent:${palette.urgent}`,
  ].join(";");
}

/**
 * Rule order is load-bearing.
 *
 * `:root[data-theme="dark"]` and `:root:not([data-theme="light"])` have
 * *identical* specificity (0,2,0), so source order is the only tie-breaker.
 * The explicit override must come last, otherwise a user on a light-preferring
 * device who picks dark would silently get light back.
 */
export function buildThemeCss(config = appConfig): string {
  const { brand, light, dark } = config.theme;
  const shape = [
    `--radius-card:${config.shape.radius}`,
    `--radius-pill:${config.shape.radiusPill}`,
    `--radius-icon:${config.shape.radiusIcon}`,
  ].join(";");

  return [
    `:root{color-scheme:light;${shape};${brandVariables(brand)};${schemeVariables(light)}}`,
    `@media (prefers-color-scheme:dark){:root:not([${THEME_ATTRIBUTE}="light"]){color-scheme:dark;${schemeVariables(dark)}}}`,
    `:root[${THEME_ATTRIBUTE}="dark"]{color-scheme:dark;${schemeVariables(dark)}}`,
    `:root[${THEME_ATTRIBUTE}="light"]{color-scheme:light;${schemeVariables(light)}}`,
  ].join("");
}

/**
 * Runs before first paint to apply the stored choice.
 *
 * Without this the page renders in the system scheme and then snaps to the
 * stored one — a full-screen white flash for a dark-mode user, which is the
 * worst possible moment for it at a night protest.
 */
export function buildThemeBootstrapScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||t==="light"){document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)}}catch(e){}})()`;
}
