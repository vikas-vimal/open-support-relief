"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/config";
import { messages, type MessageKey } from "@/lib/i18n/messages";

const LOCALE_CHANGE_EVENT = "airdrops:locale-change";

export type Translate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

interface UseI18nResult {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  /** false until mounted — mirrors the prerender, which is always DEFAULT_LOCALE. */
  ready: boolean;
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * The prerendered HTML is built once in DEFAULT_LOCALE and shared by everyone,
 * so the FIRST client render must also be DEFAULT_LOCALE or hydration mismatches.
 * `useSyncExternalStore` handles this: it renders `getServerSnapshot` during
 * hydration, then immediately re-renders with `getSnapshot`, giving a brief
 * en→hi flip for a Hindi user — acceptable for text, unlike a theme flash.
 */
function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function useI18n(): UseI18nResult {
  const locale = useSyncExternalStore(
    subscribe,
    readStoredLocale,
    getServerSnapshot,
  );

  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setLocale = useCallback((next: Locale): void => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Private browsing — the choice just will not survive a reload.
    }
    document.documentElement.setAttribute("lang", next);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  const t = useMemo<Translate>(() => {
    const table = messages[locale] ?? messages[DEFAULT_LOCALE];
    const fallback = messages[DEFAULT_LOCALE];
    return (key, vars) => interpolate(table[key] ?? fallback[key] ?? key, vars);
  }, [locale]);

  return { locale, setLocale, t, ready };
}
