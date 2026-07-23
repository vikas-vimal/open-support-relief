"use client";

import { useTheme } from "@/lib/hooks/use-theme";

/**
 * Header light/dark switch.
 *
 * Renders a neutral placeholder until mounted: the prerendered HTML cannot know
 * the stored choice, so committing to an icon server-side would hydrate-mismatch
 * and visibly flip. The placeholder keeps the header from reflowing when the
 * real icon arrives.
 */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={resolvedTheme === null ? "Toggle colour theme" : label}
      title={resolvedTheme === null ? undefined : label}
      className="border-border-strong bg-surface text-fg flex size-8 shrink-0 items-center justify-center rounded-icon border-2 text-xs leading-none"
    >
      <span aria-hidden="true">
        {resolvedTheme === null ? "◐" : isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
