/**
 * Locale config for the client-side i18n.
 *
 * Deliberately tiny and NOT next-intl: every page is a static client shell with
 * no SSR, so a runtime catalog + a localStorage-backed store is all that is
 * needed, and it keeps the 2G bundle budget intact. See lib/i18n/messages.ts.
 */

export const LOCALES = ["en", "hi"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "airdrops:locale";

export const LOCALE_LABEL: Readonly<Record<Locale, string>> = {
  en: "EN",
  hi: "हि",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "hi";
}

/**
 * Inline script that sets `<html lang>` from the stored locale BEFORE first
 * paint, so a Hindi user's page is announced correctly by assistive tech from
 * the very first frame rather than after hydration. Mirrors the theme
 * bootstrap; `<html>` carries `suppressHydrationWarning`, so the attribute may
 * legitimately differ from the server-rendered "en".
 */
export function buildLocaleBootstrapScript(): string {
  return `(function(){try{var l=localStorage.getItem(${JSON.stringify(
    LOCALE_STORAGE_KEY,
  )});if(l==="hi"||l==="en"){document.documentElement.lang=l;}}catch(e){}})();`;
}
