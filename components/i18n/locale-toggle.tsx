"use client";

import { LOCALE_LABEL } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/use-i18n";

/**
 * Header EN / हिं switch.
 *
 * Shows a neutral globe until mounted: the prerendered HTML is always the
 * default locale, so committing to a language label server-side would
 * hydrate-mismatch. The button label names the language it switches TO.
 */
export function LocaleToggle() {
  const { locale, setLocale, t, ready } = useI18n();
  const next = locale === "en" ? "hi" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("aria.locale")}
      title={t("aria.locale")}
      className="border-border-strong bg-surface text-fg flex size-8 shrink-0 items-center justify-center rounded-icon border-2 text-xs font-semibold leading-none"
    >
      <span aria-hidden="true">{ready ? LOCALE_LABEL[next] : "🌐"}</span>
    </button>
  );
}
