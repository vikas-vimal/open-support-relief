"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from "@/lib/theme/theme-css";

/** What the user is actually looking at right now, after resolving "system". */
export type ResolvedTheme = "light" | "dark";

/** Fired on toggle so other mounted consumers re-read in the same tab. */
const THEME_CHANGE_EVENT = "airdrops:theme-change";

interface UseThemeResult {
  /** null before hydration — the server cannot know the stored choice. */
  resolvedTheme: ResolvedTheme | null;
  toggleTheme: () => void;
}

function readStoredChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribe(onStoreChange: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");

  query.addEventListener("change", onStoreChange);
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    query.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot(): ResolvedTheme {
  const choice = readStoredChoice();
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * null on the server and for the first client render. Committing to a concrete
 * theme here would hydrate-mismatch, because the prerendered HTML is shared by
 * every visitor regardless of their stored choice.
 */
function getServerSnapshot(): null {
  return null;
}

/**
 * Light/dark toggle backed by the `data-theme` attribute.
 *
 * `useSyncExternalStore` rather than state + effect: the source of truth really
 * is external (localStorage and the OS media query), and this is the primitive
 * built for that. It also keeps the hook free of the cascading-render problem
 * that a setState-in-effect version would introduce.
 *
 * Starts on "system" and only pins an explicit value once the user taps — so a
 * device that flips to dark at sunset follows along until someone overrides it.
 * The inline bootstrap script in the layout applies the stored value before
 * first paint; this hook handles everything after.
 */
export function useTheme(): UseThemeResult {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleTheme = useCallback((): void => {
    const next: ResolvedTheme = getSnapshot() === "dark" ? "light" : "dark";

    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing — the choice just will not survive a reload.
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return { resolvedTheme, toggleTheme };
}
